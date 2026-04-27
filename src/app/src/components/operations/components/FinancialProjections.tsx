import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarIcon,
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  frequency: 'one-time' | 'monthly' | 'annual';
  start_date: string;
  end_date?: string;
  is_recurring: boolean;
  next_occurrence?: string;
  category: string;
}

interface FinancialProjectionsProps {
  transactions: RecurringTransaction[];
  timeframe?: 'quarterly' | 'annual' | 'three-year';
  selectedBusiness?: any;
}

export const FinancialProjections: React.FC<FinancialProjectionsProps> = ({ 
  transactions = [], 
  timeframe = 'annual',
  selectedBusiness
}) => {
  const [projectionData, setProjectionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch enhanced projections including future transactions
  useEffect(() => {
    const fetchProjections = async () => {
      if (!selectedBusiness) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (accessToken) {
          const months = timeframe === 'quarterly' ? 3 : timeframe === 'annual' ? 12 : 36;
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/projections?businessId=${selectedBusiness.id}&months=${months}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            setProjectionData(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjections();
  }, [selectedBusiness, timeframe]);

  // Calculate projections based on recurring transactions (fallback)
  const fallbackProjections = useMemo(() => {
    const recurringTransactions = (transactions || []).filter(t => t.is_recurring);
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let annualIncome = 0;
    let annualExpenses = 0;
    
    recurringTransactions.forEach(transaction => {
      const amount = transaction.amount;
      
      if (transaction.frequency === 'monthly') {
        if (transaction.type === 'income') {
          monthlyIncome += amount;
          annualIncome += amount * 12;
        } else {
          monthlyExpenses += amount;
          annualExpenses += amount * 12;
        }
      } else if (transaction.frequency === 'annual') {
        if (transaction.type === 'income') {
          monthlyIncome += amount / 12;
          annualIncome += amount;
        } else {
          monthlyExpenses += amount / 12;
          annualExpenses += amount;
        }
      }
    });
    
    return {
      monthly: {
        income: monthlyIncome,
        expenses: monthlyExpenses,
        net: monthlyIncome - monthlyExpenses
      },
      annual: {
        income: annualIncome,
        expenses: annualExpenses,
        net: annualIncome - annualExpenses
      }
    };
  }, [transactions]);

  // Use backend projection data if available, otherwise use fallback calculations
  const projections = projectionData?.projections || fallbackProjections;
  
  // Ensure projections has the expected structure
  const safeProjections = {
    monthly: {
      income: projections?.monthly?.income || 0,
      expenses: projections?.monthly?.expenses || 0,
      net: projections?.monthly?.net || 0
    },
    annual: {
      income: projections?.annual?.income || 0,
      expenses: projections?.annual?.expenses || 0,
      net: projections?.annual?.net || 0
    }
  };

  // Generate projection chart data
  const chartData = useMemo(() => {
    // If using backend projection data, use that directly
    if (projectionData?.projections) {
      return projectionData.projections.map((proj: any) => ({
        month: proj.month,
        income: proj.income.total,
        expenses: proj.expenses.total,
        net: proj.net,
        cumulativeNet: proj.runningBalance,
        projectedBalance: proj.projectedBalance,
        scheduledIncome: proj.income.scheduled,
        recurringIncome: proj.income.recurring,
        scheduledExpenses: proj.expenses.scheduled,
        recurringExpenses: proj.expenses.recurring
      }));
    }
    
    // Fallback to original calculation
    const months = timeframe === 'quarterly' ? 3 : timeframe === 'annual' ? 12 : 36;
    const data = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: i >= 12 ? 'numeric' : undefined }),
        income: fallbackProjections.monthly.income,
        expenses: fallbackProjections.monthly.expenses,
        net: fallbackProjections.monthly.net,
        cumulativeNet: fallbackProjections.monthly.net * (i + 1)
      });
    }
    
    return data;
  }, [projectionData, fallbackProjections, timeframe]);

  // Categorize recurring transactions by category
  const categoryBreakdown = useMemo(() => {
    const recurringTransactions = (transactions || []).filter(t => t.is_recurring);
    const incomeByCategory: { [key: string]: number } = {};
    const expensesByCategory: { [key: string]: number } = {};
    
    recurringTransactions.forEach(transaction => {
      const monthlyAmount = transaction.frequency === 'monthly' 
        ? transaction.amount 
        : transaction.frequency === 'annual' 
          ? transaction.amount / 12 
          : 0;
      
      if (transaction.type === 'income') {
        incomeByCategory[transaction.category] = (incomeByCategory[transaction.category] || 0) + monthlyAmount;
      } else {
        expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + monthlyAmount;
      }
    });
    
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
    
    return {
      income: Object.entries(incomeByCategory).map(([category, amount], index) => ({
        category,
        amount,
        percentage: safeProjections.monthly.income > 0 ? (amount / safeProjections.monthly.income) * 100 : 0,
        color: colors[index % colors.length]
      })),
      expenses: Object.entries(expensesByCategory).map(([category, amount], index) => ({
        category,
        amount,
        percentage: safeProjections.monthly.expenses > 0 ? (amount / safeProjections.monthly.expenses) * 100 : 0,
        color: colors[index % colors.length]
      }))
    };
  }, [transactions, safeProjections]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    // Use backend projection data if available
    if (projectionData?.projections && projectionData.projections.length > 0) {
      const firstMonth = projectionData.projections[0];
      const totalAnnualIncome = projectionData.projections
        .slice(0, 12)
        .reduce((sum: number, proj: any) => sum + proj.income.total, 0);
      const totalAnnualExpenses = projectionData.projections
        .slice(0, 12)
        .reduce((sum: number, proj: any) => sum + proj.expenses.total, 0);
      const annualNet = totalAnnualIncome - totalAnnualExpenses;
      
      const profitMargin = totalAnnualIncome > 0 
        ? (annualNet / totalAnnualIncome) * 100 
        : 0;
      
      const breakEvenMonths = firstMonth.net > 0 
        ? Math.ceil(Math.abs(firstMonth.expenses.total) / firstMonth.net)
        : Infinity;
      
      return {
        profitMargin,
        breakEvenMonths,
        burnRate: firstMonth.expenses.total,
        runway: firstMonth.net < 0 ? Math.abs(firstMonth.net) : 0,
        cashFlowStatus: firstMonth.net >= 0 ? 'positive' : 'negative',
        currentBalance: projectionData.currentBalance,
        futureTransactions: projectionData.summary?.futureTransactionsCount || 0
      };
    }
    
    // Fallback to original calculation
    const profitMargin = fallbackProjections.annual.income > 0 
      ? (fallbackProjections.annual.net / fallbackProjections.annual.income) * 100 
      : 0;
    
    const breakEvenMonths = fallbackProjections.monthly.net > 0 
      ? Math.ceil(Math.abs(fallbackProjections.monthly.expenses) / fallbackProjections.monthly.net)
      : Infinity;
    
    const burnRate = fallbackProjections.monthly.expenses;
    const runway = fallbackProjections.monthly.net < 0 ? Math.abs(fallbackProjections.monthly.net) : 0;
    
    return {
      profitMargin,
      breakEvenMonths,
      burnRate,
      runway,
      cashFlowStatus: fallbackProjections.monthly.net >= 0 ? 'positive' : 'negative',
      futureTransactions: 0
    };
  }, [projectionData, fallbackProjections]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-2.5 sm:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-base">Financial Projections</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-6 pt-0">
          <div className="flex items-center justify-center py-4 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 sm:ml-3 text-gray-600 text-xs sm:text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no data available
  if (!projectionData && (!transactions || (transactions || []).filter(t => t.is_recurring).length === 0)) {
    return (
      <Card>
        <CardHeader className="p-2.5 sm:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            Financial Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recurring transactions found</p>
            <p className="text-sm">Add monthly or annual income/expenses to see projections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Future Transactions Summary */}
      {projectionData?.summary?.futureTransactionsCount > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-2 p-2.5 sm:p-6 sm:pb-3">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-indigo-700 dark:text-indigo-300 text-xs sm:text-base">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Future Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-6 pt-0">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">Scheduled:</span>
                <span className="text-xs sm:text-base font-semibold text-indigo-600 dark:text-indigo-400">
                  {projectionData.summary.futureTransactionsCount}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">
                Will impact balance when they occur
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Scheduled Transactions */}
      {projectionData?.summary?.futureTransactionsCount > 0 && (
        <Card>
          <CardHeader className="p-2.5 sm:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base">Upcoming Scheduled</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {projectionData.projections
                .slice(0, 3) // Show first 3 months
                .map((month) => {
                  const hasScheduledIncome = month.income?.scheduled > 0;
                  const hasScheduledExpenses = month.expenses?.scheduled > 0;
                  
                  if (!hasScheduledIncome && !hasScheduledExpenses) return null;
                  
                  return (
                    <div key={month.month} className="p-2 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="font-semibold text-xs sm:text-sm">{month.month}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          Net: {month.income?.scheduled - month.expenses?.scheduled >= 0 ? '+' : ''}
                          ${(month.income?.scheduled - month.expenses?.scheduled).toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {hasScheduledIncome && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-600 text-[10px] sm:text-sm">
                              +${month.income.scheduled.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {hasScheduledExpenses && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-600 text-[10px] sm:text-sm">
                              -${month.expenses.scheduled.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)
              }
              
              {projectionData.projections.length > 3 && (
                <div className="text-center">
                  <button 
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => {
                      // Could expand to show all months
                      console.log('Show all scheduled transactions');
                    }}
                  >
                    View all {projectionData.projections.length} months →
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};