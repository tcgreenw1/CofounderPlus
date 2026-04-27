import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Play,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

interface RunwayProjectionsProps {
  transactions?: any[];
  bankBalance?: number;
}

interface ProjectionPoint {
  month: string;
  balance: number;
  income: number;
  expenses: number;
  runway: number;
  label: string;
}

interface Scenario {
  name: string;
  icon: any;
  color: string;
  incomeMultiplier: number;
  expenseMultiplier: number;
  description: string;
}

export function RunwayProjections({ transactions = [], bankBalance = 0 }: RunwayProjectionsProps) {
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [customIncome, setCustomIncome] = useState<string>('');
  const [customExpenses, setCustomExpenses] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');

  // Calculate current monthly metrics from transactions
  const currentMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= thirtyDaysAgo && t.status === 'completed';
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    recentTransactions.forEach(t => {
      if (t.type === 'income') {
        monthlyIncome += t.amount;
      } else if (t.type === 'expense') {
        monthlyExpenses += t.amount;
      }
    });

    return { monthlyIncome, monthlyExpenses };
  }, [transactions]);

  // Define scenarios
  const scenarios: Record<string, Scenario> = {
    baseline: {
      name: 'Baseline',
      icon: Play,
      color: 'var(--primary)',
      incomeMultiplier: 1.0,
      expenseMultiplier: 1.0,
      description: 'Current trajectory'
    },
    growth: {
      name: 'Growth',
      icon: TrendingUp,
      color: 'var(--success)',
      incomeMultiplier: 1.2,
      expenseMultiplier: 1.1,
      description: '20% revenue growth, 10% expense increase'
    },
    optimistic: {
      name: 'Optimistic',
      icon: Zap,
      color: 'var(--energy)',
      incomeMultiplier: 1.5,
      expenseMultiplier: 1.0,
      description: '50% revenue growth, flat expenses'
    },
    conservative: {
      name: 'Conservative',
      icon: TrendingDown,
      color: 'var(--destructive)',
      incomeMultiplier: 0.8,
      expenseMultiplier: 1.0,
      description: '20% revenue decline, flat expenses'
    }
  };

  // Calculate projections
  const projectionData = useMemo(() => {
    const scenario = scenarios[selectedScenario];
    const baseIncome = customIncome ? parseFloat(customIncome) : currentMetrics.monthlyIncome;
    const baseExpenses = customExpenses ? parseFloat(customExpenses) : currentMetrics.monthlyExpenses;

    const monthlyIncome = baseIncome * scenario.incomeMultiplier;
    const monthlyExpenses = baseExpenses * scenario.expenseMultiplier;
    const netCashFlow = monthlyIncome - monthlyExpenses;

    const data: ProjectionPoint[] = [];
    let currentBalance = bankBalance;
    const today = new Date();

    for (let i = 0; i <= projectionMonths; i++) {
      const projectionDate = new Date(today);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      const monthLabel = projectionDate.toLocaleDateString('en-US', { 
        month: 'short',
        year: i % 3 === 0 ? 'numeric' : undefined 
      });

      // Calculate runway remaining (in months)
      const runway = netCashFlow < 0 && Math.abs(netCashFlow) > 0
        ? currentBalance / Math.abs(netCashFlow)
        : currentBalance > 0 ? 999 : 0;

      data.push({
        month: monthLabel,
        balance: Math.max(0, currentBalance),
        income: monthlyIncome,
        expenses: monthlyExpenses,
        runway: Math.max(0, runway),
        label: `Month ${i}`
      });

      // Update balance for next month
      currentBalance += netCashFlow;
    }

    return data;
  }, [bankBalance, currentMetrics, projectionMonths, customIncome, customExpenses, selectedScenario]);

  // Find when runway hits zero
  const runoutMonth = projectionData.findIndex(d => d.balance === 0);
  const hasRunout = runoutMonth !== -1;

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const finalMonth = projectionData[projectionData.length - 1];
    const firstMonth = projectionData[0];
    const netCashFlow = firstMonth.income - firstMonth.expenses;
    
    return {
      finalBalance: finalMonth.balance,
      totalIncome: firstMonth.income * projectionMonths,
      totalExpenses: firstMonth.expenses * projectionMonths,
      netCashFlow: netCashFlow,
      runoutDate: hasRunout ? projectionData[runoutMonth].month : null,
      isPositive: netCashFlow >= 0
    };
  }, [projectionData, projectionMonths, hasRunout, runoutMonth]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 rounded-lg shadow-lg border"
          style={{ 
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <p className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>
            {payload[0].payload.month}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Balance:</span>
              <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {formatCurrency(payload[0].value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Income:</span>
              <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {formatCurrency(payload[0].payload.income)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--destructive)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Expenses:</span>
              <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {formatCurrency(payload[0].payload.expenses)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3" style={{ color: 'var(--energy)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Runway:</span>
              <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {payload[0].payload.runway > 100 ? '∞' : `${payload[0].payload.runway.toFixed(1)}m`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card style={{ borderColor: 'var(--border)' }}>
      <CardHeader className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" style={{ color: 'var(--primary)' }} />
              Runway Projections
            </CardTitle>
            <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Model your financial runway across different scenarios
            </CardDescription>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant="outline"
            className="text-xs"
            style={{ 
              borderColor: summaryMetrics.isPositive ? 'var(--success)' : 'var(--destructive)',
              color: summaryMetrics.isPositive ? 'var(--success)' : 'var(--destructive)',
              backgroundColor: summaryMetrics.isPositive ? 'rgba(108, 255, 108, 0.1)' : 'rgba(255, 79, 79, 0.1)'
            }}
          >
            {summaryMetrics.isPositive ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Cash Flow Positive
              </>
            ) : (
              <>
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Burning Cash
              </>
            )}
          </Badge>
        </div>

        {/* Scenario Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mt-2 sm:mt-3 md:mt-4">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const Icon = scenario.icon;
            const isSelected = selectedScenario === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedScenario(key)}
                className="p-1.5 sm:p-2 md:p-3 rounded-lg border transition-all text-left"
                style={{
                  borderColor: isSelected ? scenario.color : 'var(--border)',
                  backgroundColor: isSelected ? `${scenario.color}15` : 'var(--card)',
                  borderRadius: 'var(--radius-md)',
                  borderWidth: isSelected ? '2px' : '1px'
                }}
              >
                <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5" style={{ color: scenario.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ fontWeight: 'var(--font-weight-semibold)', color: scenario.color }}>
                      {scenario.name}
                    </p>
                    <p className="text-[9px] sm:text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Custom Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="projectionMonths" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Projection Period
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="projectionMonths"
                  type="number"
                  min="3"
                  max="36"
                  value={projectionMonths}
                  onChange={(e) => setProjectionMonths(Math.max(3, Math.min(36, parseInt(e.target.value) || 12)))}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Months (3-36)
              </p>
            </div>

            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="projIncome" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Base Monthly Income
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="projIncome"
                  type="number"
                  placeholder={formatCurrency(currentMetrics.monthlyIncome)}
                  value={customIncome}
                  onChange={(e) => setCustomIncome(e.target.value)}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Current: {formatCurrency(currentMetrics.monthlyIncome)}
              </p>
            </div>

            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="projExpenses" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Base Monthly Expenses
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="projExpenses"
                  type="number"
                  placeholder={formatCurrency(currentMetrics.monthlyExpenses)}
                  value={customExpenses}
                  onChange={(e) => setCustomExpenses(e.target.value)}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Current: {formatCurrency(currentMetrics.monthlyExpenses)}
              </p>
            </div>
          </div>

          {/* Projection Chart */}
          <div 
            className="p-2 sm:p-3 md:p-4 rounded-lg" 
            style={{ 
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div className="h-48 sm:h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={projectionData}
                  margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: '10px' }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: '10px' }}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                    iconType="circle"
                  />
                  {hasRunout && (
                    <ReferenceLine 
                      x={projectionData[runoutMonth].month} 
                      stroke="var(--destructive)" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: 'Cash Depleted', 
                        position: 'top',
                        style: { fill: 'var(--destructive)', fontSize: '10px', fontWeight: 'var(--font-weight-semibold)' }
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                    name="Projected Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Final Balance
                </p>
              </div>
              <p 
                className="text-base sm:text-lg md:text-xl" 
                style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: summaryMetrics.finalBalance > 0 ? 'var(--success)' : 'var(--destructive)'
                }}
              >
                {formatCurrency(summaryMetrics.finalBalance)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                After {projectionMonths} months
              </p>
            </div>

            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--success)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Total Income
                </p>
              </div>
              <p className="text-base sm:text-lg md:text-xl" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                {formatCurrency(summaryMetrics.totalIncome)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Over period
              </p>
            </div>

            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--destructive)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Total Expenses
                </p>
              </div>
              <p className="text-base sm:text-lg md:text-xl" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                {formatCurrency(summaryMetrics.totalExpenses)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Over period
              </p>
            </div>

            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Monthly Net
                </p>
              </div>
              <p 
                className="text-base sm:text-lg md:text-xl" 
                style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: summaryMetrics.netCashFlow >= 0 ? 'var(--success)' : 'var(--destructive)'
                }}
              >
                {summaryMetrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summaryMetrics.netCashFlow)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Cash flow
              </p>
            </div>
          </div>

          {/* Runout Warning */}
          {hasRunout && (
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg border-l-4 flex items-start gap-2 sm:gap-3"
              style={{ 
                backgroundColor: 'rgba(255, 79, 79, 0.1)',
                borderLeftColor: 'var(--destructive)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" style={{ color: 'var(--destructive)' }} />
              <div className="flex-1">
                <p className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--destructive)' }}>
                  Cash Depletion Projected
                </p>
                <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--destructive)' }}>
                  At current burn rate, cash will run out in <strong>{summaryMetrics.runoutDate}</strong>. 
                  Consider increasing revenue, reducing expenses, or securing additional funding.
                </p>
              </div>
            </div>
          )}

          {/* Positive Runway Message */}
          {!hasRunout && summaryMetrics.isPositive && (
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg border-l-4 flex items-start gap-2 sm:gap-3"
              style={{ 
                backgroundColor: 'rgba(108, 255, 108, 0.1)',
                borderLeftColor: 'var(--success)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
              <div className="flex-1">
                <p className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--success)' }}>
                  Sustainable Runway
                </p>
                <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--success)' }}>
                  Your business is generating positive cash flow. Projected balance after {projectionMonths} months: <strong>{formatCurrency(summaryMetrics.finalBalance)}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}