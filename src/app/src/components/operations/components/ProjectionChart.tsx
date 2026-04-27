import React, { useMemo } from 'react';
import { BarChart3, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';

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

interface ProjectionChartProps {
  transactions?: Transaction[];
  bankBalance?: BankBalance;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = React.memo(({ transactions = [], bankBalance }) => {
  // Calculate monthly averages and projections
  const projectionData = useMemo(() => {
    const currentBalance = bankBalance?.balance || 0;
    const now = new Date();
    
    // Calculate monthly income and expense averages
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 12 && t.status === 'completed'; // Last 12 months of completed transactions
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
    
    // Generate 6-month projection
    const projections = [];
    let runningBalance = currentBalance;
    
    for (let i = 0; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (i > 0) {
        runningBalance += projectedMonthlyNet;
      }
      
      projections.push({
        month: monthName,
        balance: Math.round(runningBalance),
        income: Math.round(projectedMonthlyIncome),
        expenses: Math.round(projectedMonthlyExpenses),
        net: Math.round(projectedMonthlyNet),
        threeMonthLine: Math.round(projectedMonthlyExpenses * 3),
        sixMonthLine: Math.round(projectedMonthlyExpenses * 6)
      });
    }
    
    return {
      projections,
      monthlyIncome: projectedMonthlyIncome,
      monthlyExpenses: projectedMonthlyExpenses,
      monthlyNet: projectedMonthlyNet,
      threeMonthReserve: projectedMonthlyExpenses * 3,
      sixMonthReserve: projectedMonthlyExpenses * 6,
      currentBalance
    };
  }, [transactions, bankBalance]);
  
  // Determine financial health status
  const getFinancialHealthStatus = () => {
    const { currentBalance, threeMonthReserve, sixMonthReserve } = projectionData;
    
    if (currentBalance >= sixMonthReserve) {
      return {
        status: 'excellent',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        message: 'Excellent! You have 6+ months of expenses saved.',
        recommendation: 'Consider investing surplus funds or expanding your business.'
      };
    } else if (currentBalance >= threeMonthReserve) {
      return {
        status: 'good',
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        message: 'Good! You meet the minimum 3-month emergency fund.',
        recommendation: 'Aim to build up to 6 months of expenses for optimal security.'
      };
    } else {
      return {
        status: 'warning',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        message: 'Warning: You have less than 3 months of expenses saved.',
        recommendation: 'Focus on building your emergency fund to 3-6 months of expenses.'
      };
    }
  };
  
  const healthStatus = getFinancialHealthStatus();
  const StatusIcon = healthStatus.icon;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Financial Health Status */}
      <Alert className={`${healthStatus.borderColor} p-2.5 sm:p-4`}>
        <StatusIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${healthStatus.color}`} />
        <AlertDescription className="flex flex-col gap-1.5 sm:gap-2">
          <div>
            <span className="text-xs sm:text-base font-semibold">{healthStatus.message}</span>
            <br />
            <span className="text-[10px] sm:text-sm text-muted-foreground">{healthStatus.recommendation}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
              3mo: ${Math.round(projectionData.threeMonthReserve).toLocaleString()}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
              6mo: ${Math.round(projectionData.sixMonthReserve).toLocaleString()}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* 6-Month Bank Balance Projection Chart */}
      <Card>
        <CardHeader className="p-2.5 sm:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2">
            <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-base">6-Mo Projection</span>
          </CardTitle>
          <p className="text-[10px] sm:text-sm text-muted-foreground">
            Based on spending patterns
          </p>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="h-48 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData.projections}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={35}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'balance' ? 'Projected Balance' :
                    name === 'threeMonthLine' ? '3-Month Emergency Fund' :
                    name === 'sixMonthLine' ? '6-Month Emergency Fund' : name
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#balanceGradient)"
                />
                <ReferenceLine 
                  y={projectionData.threeMonthReserve} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: "3-Month Reserve", position: "insideTopRight", style: { fontSize: '11px' } }}
                />
                <ReferenceLine 
                  y={projectionData.sixMonthReserve} 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: "6-Month Reserve", position: "insideTopRight", style: { fontSize: '11px' } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Projection Summary */}
          <div className="mt-2 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-4">
            <div className="text-center p-1.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-semibold text-blue-600 text-[10px] sm:text-sm">End 6mo</div>
              <div className="text-xs sm:text-lg font-bold">
                ${projectionData.projections[6]?.balance.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-1.5 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="font-semibold text-orange-600 text-[10px] sm:text-sm">3mo Res</div>
              <div className="text-xs sm:text-lg font-bold">
                ${Math.round(projectionData.threeMonthReserve).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-1.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="font-semibold text-green-600 text-[10px] sm:text-sm">6mo Res</div>
              <div className="text-xs sm:text-lg font-bold">
                ${Math.round(projectionData.sixMonthReserve).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});