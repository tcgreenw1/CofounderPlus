import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Flame, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Target
} from 'lucide-react';

interface BurnRateCalculatorProps {
  transactions?: any[];
  bankBalance?: number;
}

interface BurnRateMetrics {
  monthlyBurnRate: number;
  runwayMonths: number;
  dailyBurnRate: number;
  cashOnHand: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  projectedRunOutDate: string | null;
}

export function BurnRateCalculator({ transactions = [], bankBalance = 0 }: BurnRateCalculatorProps) {
  const [metrics, setMetrics] = useState<BurnRateMetrics>({
    monthlyBurnRate: 0,
    runwayMonths: 0,
    dailyBurnRate: 0,
    cashOnHand: bankBalance,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netCashFlow: 0,
    projectedRunOutDate: null
  });

  const [customCash, setCustomCash] = useState<string>('');
  const [customMonthlyExpenses, setCustomMonthlyExpenses] = useState<string>('');
  const [customMonthlyIncome, setCustomMonthlyIncome] = useState<string>('');

  // Calculate burn rate from transactions
  useEffect(() => {
    calculateBurnRate();
  }, [transactions, bankBalance, customCash, customMonthlyExpenses, customMonthlyIncome]);

  const calculateBurnRate = () => {
    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= thirtyDaysAgo && t.status === 'completed';
    });

    // Calculate actual monthly income and expenses
    let actualMonthlyIncome = 0;
    let actualMonthlyExpenses = 0;

    recentTransactions.forEach(t => {
      if (t.type === 'income') {
        actualMonthlyIncome += t.amount;
      } else if (t.type === 'expense') {
        actualMonthlyExpenses += t.amount;
      }
    });

    // Use custom values if provided, otherwise use calculated values
    const monthlyIncome = customMonthlyIncome ? parseFloat(customMonthlyIncome) : actualMonthlyIncome;
    const monthlyExpenses = customMonthlyExpenses ? parseFloat(customMonthlyExpenses) : actualMonthlyExpenses;
    const cashOnHand = customCash ? parseFloat(customCash) : bankBalance;

    // Calculate net burn rate (expenses - income)
    const netCashFlow = monthlyIncome - monthlyExpenses;
    const monthlyBurnRate = Math.abs(netCashFlow);
    const dailyBurnRate = monthlyBurnRate / 30;

    // Calculate runway (months until money runs out)
    let runwayMonths = 0;
    let projectedRunOutDate = null;

    if (netCashFlow < 0 && monthlyBurnRate > 0) {
      // Losing money - calculate runway
      runwayMonths = cashOnHand / monthlyBurnRate;
      
      // Calculate projected run out date
      const today = new Date();
      const runOutDate = new Date(today);
      runOutDate.setMonth(runOutDate.getMonth() + Math.floor(runwayMonths));
      runOutDate.setDate(runOutDate.getDate() + ((runwayMonths % 1) * 30));
      projectedRunOutDate = runOutDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (netCashFlow >= 0) {
      // Making money - infinite runway
      runwayMonths = Infinity;
      projectedRunOutDate = null;
    }

    setMetrics({
      monthlyBurnRate,
      runwayMonths,
      dailyBurnRate,
      cashOnHand,
      monthlyIncome,
      monthlyExpenses,
      netCashFlow,
      projectedRunOutDate
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRunwayStatus = () => {
    if (metrics.netCashFlow >= 0) {
      return {
        icon: CheckCircle,
        text: 'Positive Cash Flow',
        color: 'var(--success)',
        bgColor: 'rgba(108, 255, 108, 0.1)',
        description: 'Your income exceeds expenses - business is sustainable!'
      };
    } else if (metrics.runwayMonths > 12) {
      return {
        icon: CheckCircle,
        text: 'Healthy Runway',
        color: 'var(--success)',
        bgColor: 'rgba(108, 255, 108, 0.1)',
        description: 'You have over 12 months of runway'
      };
    } else if (metrics.runwayMonths > 6) {
      return {
        icon: Info,
        text: 'Moderate Runway',
        color: 'var(--energy)',
        bgColor: 'rgba(255, 207, 0, 0.1)',
        description: 'Consider planning for additional funding or revenue growth'
      };
    } else if (metrics.runwayMonths > 3) {
      return {
        icon: AlertTriangle,
        text: 'Limited Runway',
        color: 'var(--energy)',
        bgColor: 'rgba(255, 207, 0, 0.1)',
        description: 'Start fundraising or reducing expenses soon'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: 'Critical Runway',
        color: 'var(--destructive)',
        bgColor: 'rgba(255, 79, 79, 0.1)',
        description: 'Immediate action required - less than 3 months of runway'
      };
    }
  };

  const runwayStatus = getRunwayStatus();
  const StatusIcon = runwayStatus.icon;

  return (
    <Card style={{ borderColor: 'var(--border)' }}>
      <CardHeader className="p-2 sm:p-3 md:p-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" style={{ color: 'var(--primary)' }} />
              Burn Rate Calculator
            </CardTitle>
            <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Track your monthly cash burn and runway
            </CardDescription>
          </div>
          <Badge 
            variant="outline"
            className="text-xs"
            style={{ 
              borderColor: runwayStatus.color,
              color: runwayStatus.color,
              backgroundColor: runwayStatus.bgColor
            }}
          >
            <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">{runwayStatus.text}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Status Alert */}
          {metrics.netCashFlow < 0 && (
            <Alert 
              style={{ 
                borderColor: runwayStatus.color,
                backgroundColor: runwayStatus.bgColor
              }}
            >
              <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: runwayStatus.color }} />
              <AlertDescription className="text-xs sm:text-sm" style={{ color: runwayStatus.color }}>
                {runwayStatus.description}
              </AlertDescription>
            </Alert>
          )}

          {/* Custom Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="cashOnHand" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Cash on Hand
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="cashOnHand"
                  type="number"
                  placeholder={formatCurrency(bankBalance)}
                  value={customCash}
                  onChange={(e) => setCustomCash(e.target.value)}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Current: {formatCurrency(bankBalance)}
              </p>
            </div>

            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="monthlyExpenses" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Monthly Expenses
              </Label>
              <div className="relative">
                <TrendingDown className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="monthlyExpenses"
                  type="number"
                  placeholder="Enter amount"
                  value={customMonthlyExpenses}
                  onChange={(e) => setCustomMonthlyExpenses(e.target.value)}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Last 30d: {formatCurrency(metrics.monthlyExpenses)}
              </p>
            </div>

            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="monthlyIncome" className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Monthly Income
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="monthlyIncome"
                  type="number"
                  placeholder="Enter amount"
                  value={customMonthlyIncome}
                  onChange={(e) => setCustomMonthlyIncome(e.target.value)}
                  className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  style={{ 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Last 30d: {formatCurrency(metrics.monthlyIncome)}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {/* Monthly Burn Rate */}
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Monthly Burn
                </p>
              </div>
              <p className="text-base sm:text-lg md:text-xl" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                {metrics.netCashFlow < 0 ? formatCurrency(metrics.monthlyBurnRate) : formatCurrency(0)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {metrics.netCashFlow >= 0 ? 'Profitable' : 'Net negative'}
              </p>
            </div>

            {/* Daily Burn Rate */}
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
                <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                  Daily Burn
                </p>
              </div>
              <p className="text-base sm:text-lg md:text-xl" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                {metrics.netCashFlow < 0 ? formatCurrency(metrics.dailyBurnRate) : formatCurrency(0)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Per day average
              </p>
            </div>

            {/* Runway */}
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
                  Runway
                </p>
              </div>
              <p className="text-base sm:text-lg md:text-xl" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                {metrics.runwayMonths === Infinity 
                  ? '∞' 
                  : `${Math.floor(metrics.runwayMonths)}m`
                }
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {metrics.runwayMonths === Infinity 
                  ? 'Sustainable' 
                  : `${Math.floor((metrics.runwayMonths % 1) * 30)}d remaining`
                }
              </p>
            </div>

            {/* Net Cash Flow */}
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
                  Net Cash Flow
                </p>
              </div>
              <p 
                className="text-base sm:text-lg md:text-xl" 
                style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: metrics.netCashFlow >= 0 ? 'var(--success)' : 'var(--destructive)'
                }}
              >
                {metrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(metrics.netCashFlow)}
              </p>
              <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Income - Expenses
              </p>
            </div>
          </div>

          {/* Projected Run Out Date */}
          {metrics.projectedRunOutDate && metrics.netCashFlow < 0 && (
            <div 
              className="p-2 sm:p-3 md:p-4 rounded-lg border-l-4" 
              style={{ 
                backgroundColor: 'var(--muted)',
                borderLeftColor: runwayStatus.color,
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    Projected Cash Depletion Date
                  </p>
                  <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Based on current burn rate and cash on hand
                  </p>
                </div>
                <p className="text-sm sm:text-base md:text-lg" style={{ fontWeight: 'var(--font-weight-bold)', color: runwayStatus.color }}>
                  {metrics.projectedRunOutDate}
                </p>
              </div>
            </div>
          )}

          {/* Positive Cash Flow Message */}
          {metrics.netCashFlow >= 0 && (
            <div 
              className="p-3 sm:p-4 rounded-lg text-center" 
              style={{ 
                backgroundColor: 'rgba(108, 255, 108, 0.1)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2" style={{ color: 'var(--success)' }} />
              <p className="text-xs sm:text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--success)' }}>
                Congratulations! Your business is cash flow positive
              </p>
              <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: 'var(--success)' }}>
                You're generating {formatCurrency(Math.abs(metrics.netCashFlow))} more than you're spending per month
              </p>
            </div>
          )}

          {/* Info Footer */}
          <div 
            className="p-2 sm:p-3 rounded-lg" 
            style={{ 
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div className="flex items-start gap-1.5 sm:gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <strong>How it works:</strong> Burn rate is calculated from your last 30 days of completed transactions. 
                You can override values above to model different scenarios. Runway shows how many months until cash runs out at current burn rate.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}