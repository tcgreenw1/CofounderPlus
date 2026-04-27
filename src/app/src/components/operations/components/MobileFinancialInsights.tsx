import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, PieChart, BarChart3, 
  Calendar, Target, AlertTriangle, CheckCircle,
  DollarSign, Activity, Zap, Eye, EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'scheduled';
}

interface Budget {
  id: string;
  name: string;
  category: string;
  budget_amount: number;
  spent_amount: number;
  status: 'active' | 'exceeded' | 'completed';
}

interface MobileFinancialInsightsProps {
  transactions: Transaction[];
  budgets: Budget[];
  balanceVisible?: boolean;
  className?: string;
}

interface InsightCard {
  id: string;
  title: string;
  value: string;
  change?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  status: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: React.ElementType;
  description?: string;
}

export function MobileFinancialInsights({ 
  transactions, 
  budgets, 
  balanceVisible = true,
  className = ""
}: MobileFinancialInsightsProps) {
  
  // Calculate insights from transactions and budgets
  const insights = useMemo(() => {
    const completedTransactions = transactions.filter(t => (t.status || 'completed') === 'completed');
    const incomeTransactions = completedTransactions.filter(t => t.type === 'income');
    const expenseTransactions = completedTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netIncome = totalIncome - totalExpenses;
    
    // Category breakdown
    const categoryBreakdown = expenseTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topExpenseCategory = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    
    // Recent trends (comparing last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    const recentExpenses = expenseTransactions
      .filter(t => new Date(t.date) >= sevenDaysAgo)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousExpenses = expenseTransactions
      .filter(t => new Date(t.date) >= fourteenDaysAgo && new Date(t.date) < sevenDaysAgo)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenseChange = previousExpenses > 0 
      ? ((recentExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;
    
    // Budget insights
    const activeBudgets = budgets.filter(b => b.status === 'active');
    const exceededBudgets = budgets.filter(b => b.status === 'exceeded');
    const budgetUtilization = activeBudgets.length > 0 
      ? (activeBudgets.reduce((sum, b) => sum + (b.spent_amount / b.budget_amount), 0) / activeBudgets.length) * 100
      : 0;
    
    // Average transaction amount
    const avgTransactionAmount = completedTransactions.length > 0
      ? completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / completedTransactions.length
      : 0;
    
    // Monthly spending rate
    const monthlyExpenses = expenseTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthlySpending = (monthlyExpenses / dayOfMonth) * daysInMonth;
    
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      categoryBreakdown,
      topExpenseCategory: topExpenseCategory ? { name: topExpenseCategory[0], amount: topExpenseCategory[1] } : null,
      expenseChange,
      activeBudgets: activeBudgets.length,
      exceededBudgets: exceededBudgets.length,
      budgetUtilization,
      avgTransactionAmount,
      monthlyExpenses,
      projectedMonthlySpending,
      transactionCount: completedTransactions.length
    };
  }, [transactions, budgets]);

  const formatCurrency = (amount: number, showFull = false) => {
    if (!balanceVisible) return '••••';
    
    const abs = Math.abs(amount);
    if (!showFull && abs >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (!showFull && abs >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Generate insight cards
  const insightCards: InsightCard[] = [
    {
      id: 'spending-trend',
      title: 'Weekly Spending',
      value: formatCurrency(insights.totalExpenses / 4), // Weekly average
      change: {
        direction: insights.expenseChange > 0 ? 'up' : insights.expenseChange < 0 ? 'down' : 'neutral',
        percentage: Math.abs(insights.expenseChange),
        period: 'vs last week'
      },
      status: insights.expenseChange > 10 ? 'warning' : insights.expenseChange < -10 ? 'positive' : 'neutral',
      icon: TrendingDown,
      description: 'Average weekly expenses'
    },
    {
      id: 'budget-health',
      title: 'Budget Health',
      value: `${insights.budgetUtilization.toFixed(0)}%`,
      status: insights.exceededBudgets > 0 ? 'negative' : insights.budgetUtilization > 80 ? 'warning' : 'positive',
      icon: Target,
      description: `${insights.activeBudgets} active budgets${insights.exceededBudgets > 0 ? `, ${insights.exceededBudgets} exceeded` : ''}`
    },
    {
      id: 'top-category',
      title: 'Top Expense',
      value: insights.topExpenseCategory?.name || 'None',
      status: 'neutral',
      icon: PieChart,
      description: insights.topExpenseCategory ? formatCurrency(insights.topExpenseCategory.amount) : 'No expenses'
    },
    {
      id: 'monthly-projection',
      title: 'Monthly Projection',
      value: formatCurrency(insights.projectedMonthlySpending),
      status: insights.projectedMonthlySpending > insights.monthlyExpenses * 1.2 ? 'warning' : 'neutral',
      icon: BarChart3,
      description: 'Based on current spending rate'
    }
  ];

  // Prepare chart data
  const categoryChartData = Object.entries(insights.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / insights.totalExpenses) * 100).toFixed(1)
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={`mobile-layout space-y-4 mobile-space-y-2 ${className}`}>
      
      {/* Quick Insights Grid */}
      <div className="grid grid-cols-2 gap-3">
        {insightCards.map((card) => {
          const IconComponent = card.icon;
          const getStatusColors = () => {
            switch (card.status) {
              case 'positive': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
              case 'negative': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
              case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
              default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
            }
          };
          
          return (
            <Card key={card.id} className={`mobile-card mobile-compact ${getStatusColors()}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="mobile-text-xs text-gray-600 dark:text-gray-400 truncate">
                      {card.title}
                    </p>
                    <p className="mobile-text-sm font-semibold mt-1 truncate">
                      {card.value}
                    </p>
                  </div>
                  <IconComponent className="mobile-icon-sm text-gray-500 flex-shrink-0" />
                </div>
                
                {card.change && (
                  <div className="flex items-center gap-1 mb-1">
                    {card.change.direction === 'up' ? (
                      <TrendingUp className="mobile-icon-xs text-red-500" />
                    ) : card.change.direction === 'down' ? (
                      <TrendingDown className="mobile-icon-xs text-green-500" />
                    ) : null}
                    <span className={`mobile-text-xs ${
                      card.change.direction === 'up' ? 'text-red-600' : 
                      card.change.direction === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {card.change.percentage.toFixed(1)}% {card.change.period}
                    </span>
                  </div>
                )}
                
                {card.description && (
                  <p className="mobile-text-xs text-gray-500 truncate">
                    {card.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Expense Breakdown Chart */}
      {categoryChartData.length > 0 && (
        <Card className="mobile-card mobile-compact">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="mobile-text-sm">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-32 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '10px', 
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1 mobile-space-y-1">
              {categoryChartData.slice(0, 3).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="mobile-text-xs truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="mobile-text-xs font-medium">{formatCurrency(item.value)}</p>
                    <p className="mobile-text-xs text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
              ))}
              {categoryChartData.length > 3 && (
                <p className="mobile-text-xs text-gray-500 text-center pt-1">
                  +{categoryChartData.length - 3} more categories
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Status Summary */}
      {budgets.length > 0 && (
        <Card className="mobile-card mobile-compact">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="mobile-text-sm flex items-center gap-2">
              <Target className="mobile-icon-sm" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2 mobile-space-y-1">
              <div className="flex items-center justify-between">
                <span className="mobile-text-xs text-gray-600">Overall Utilization</span>
                <span className={`mobile-text-xs font-medium ${
                  insights.budgetUtilization > 100 ? 'text-red-600' :
                  insights.budgetUtilization > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {insights.budgetUtilization.toFixed(0)}%
                </span>
              </div>
              
              <Progress 
                value={Math.min(insights.budgetUtilization, 100)} 
                className="h-1.5"
              />
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <p className="mobile-text-xs text-gray-500">Active</p>
                  <p className="mobile-text-sm font-semibold text-blue-600">{insights.activeBudgets}</p>
                </div>
                <div className="text-center">
                  <p className="mobile-text-xs text-gray-500">Exceeded</p>
                  <p className="mobile-text-sm font-semibold text-red-600">{insights.exceededBudgets}</p>
                </div>
                <div className="text-center">
                  <p className="mobile-text-xs text-gray-500">Total</p>
                  <p className="mobile-text-sm font-semibold">{budgets.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Health Score */}
      <Card className="mobile-card mobile-compact bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Activity className="mobile-icon-sm text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="mobile-text-sm font-medium">Financial Health</h3>
              <div className="flex items-center gap-2 mt-1">
                {insights.netIncome >= 0 ? (
                  <CheckCircle className="mobile-icon-xs text-green-500" />
                ) : (
                  <AlertTriangle className="mobile-icon-xs text-red-500" />
                )}
                <span className={`mobile-text-xs ${insights.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.netIncome >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="mobile-text-xs text-gray-500">Net Income</p>
              <p className={`mobile-text-sm font-semibold ${insights.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(insights.netIncome)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}