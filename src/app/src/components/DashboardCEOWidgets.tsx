import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Activity, Target, Megaphone, CreditCard, ArrowUp, ArrowDown, Flame, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface DashboardCEOWidgetsProps {
  businessId: string;
  userId: string;
}

interface FinanceData {
  transactions: any[];
  connectedBanks: any[];
  cashBalance?: number;
}

interface SalesData {
  deals: any[];
  contacts: any[];
}

interface MarketingData {
  campaigns: any[];
}

export const DashboardCEOWidgets: React.FC<DashboardCEOWidgetsProps> = ({ businessId, userId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);

  // Load all dashboard data
  const loadDashboardData = async () => {
      if (!businessId || !userId) return;

      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Load finance data
        const financeResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${businessId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (financeResponse.ok) {
          const finance = await financeResponse.json();
          
          // Load connected banks to get real cash balance
          const banksResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/connected-accounts/${businessId}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (banksResponse.ok) {
            const banksData = await banksResponse.json();
            finance.connectedBanks = banksData.banks || [];
            
            // Calculate total cash balance from connected banks
            const totalBankBalance = finance.connectedBanks.reduce((sum: number, bank: any) => {
              return sum + (bank.current_balance || 0);
            }, 0);
            
            // Use bank balance if available, otherwise use the stored balance
            finance.cashBalance = totalBankBalance > 0 ? totalBankBalance : (finance.bankBalance?.balance || 0);
          } else {
            // Use stored bank balance as fallback
            finance.cashBalance = finance.bankBalance?.balance || 0;
            finance.connectedBanks = [];
          }
          
          setFinanceData(finance);
        }

        // Load sales data (don't fail if endpoint doesn't exist)
        try {
          const salesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/data?businessId=${businessId}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (salesResponse.ok) {
            const sales = await salesResponse.json();
            setSalesData(sales);
          }
        } catch (error) {
          console.log('Sales data not available:', error);
          setSalesData({ deals: [], contacts: [] });
        }

        // Load marketing data (don't fail if endpoint doesn't exist)
        try {
          const marketingResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/data?businessId=${businessId}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (marketingResponse.ok) {
            const marketing = await marketingResponse.json();
            setMarketingData(marketing);
          }
        } catch (error) {
          console.log('Marketing data not available:', error);
          setMarketingData({ campaigns: [] });
        }

      } catch (error: any) {
        // Network errors are common when offline or during development
        if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('Error loading dashboard data:', error);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadDashboardData();
  }, [businessId, userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue calculations
    let revenueToday = 0;
    let revenueThisWeek = 0;
    let revenueThisMonth = 0;
    let expensesToday = 0;
    let expensesThisWeek = 0;
    let expensesThisMonth = 0;

    if (financeData?.transactions) {
      financeData.transactions.forEach((t: any) => {
        const txDate = new Date(t.date);
        const amount = Math.abs(t.amount || 0);

        if (t.type === 'income') {
          if (txDate >= today) revenueToday += amount;
          if (txDate >= thisWeekStart) revenueThisWeek += amount;
          if (txDate >= thisMonthStart) revenueThisMonth += amount;
        } else if (t.type === 'expense') {
          if (txDate >= today) expensesToday += amount;
          if (txDate >= thisWeekStart) expensesThisWeek += amount;
          if (txDate >= thisMonthStart) expensesThisMonth += amount;
        }
      });
    }

    // Cash balance from connected banks
    const cashBalance = financeData?.cashBalance || 
      financeData?.connectedBanks?.reduce((sum, bank: any) => {
        return sum + (bank.current_balance || 0);
      }, 0) || 0;

    // Profit calculation
    const profitThisMonth = revenueThisMonth - expensesThisMonth;

    // Burn rate (average monthly expenses over last 3 months)
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    let expensesLast3Months = 0;
    if (financeData?.transactions) {
      financeData.transactions.forEach((t: any) => {
        const txDate = new Date(t.date);
        if (t.type === 'expense' && txDate >= threeMonthsAgo) {
          expensesLast3Months += Math.abs(t.amount || 0);
        }
      });
    }
    const burnRate = expensesLast3Months / 3;

    // Runway calculation (months remaining at current burn rate)
    const runway = burnRate > 0 ? cashBalance / burnRate : 0;

    // Active deals
    const activeDeals = salesData?.deals?.filter((d: any) => 
      d.status !== 'won' && d.status !== 'lost'
    ).length || 0;

    const activeDealValue = salesData?.deals
      ?.filter((d: any) => d.status !== 'won' && d.status !== 'lost')
      .reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0;

    // Marketing spend
    const marketingSpend = marketingData?.campaigns
      ?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0;

    // Top expense categories
    const expensesByCategory: { [key: string]: number } = {};
    if (financeData?.transactions) {
      financeData.transactions
        .filter((t: any) => t.type === 'expense' && new Date(t.date) >= thisMonthStart)
        .forEach((t: any) => {
          const category = t.category || 'Uncategorized';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount || 0);
        });
    }

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Alerts - prioritize critical alerts
    const alerts: Array<{ type: 'warning' | 'info' | 'danger'; message: string; priority: number }> = [];
    
    if (cashBalance < burnRate && burnRate > 0) {
      alerts.push({ type: 'danger', message: 'Cash balance below monthly burn rate', priority: 1 });
    }
    
    if (runway < 3 && runway > 0) {
      alerts.push({ type: 'danger', message: `Low runway: ${runway.toFixed(1)} months remaining`, priority: 2 });
    }
    
    if (burnRate > revenueThisMonth && revenueThisMonth > 0) {
      alerts.push({ type: 'warning', message: 'Expenses exceed revenue this month', priority: 3 });
    }

    if (activeDeals === 0 && salesData) {
      alerts.push({ type: 'info', message: 'No active deals in pipeline', priority: 4 });
    }
    
    // Sort by priority and take top 2
    alerts.sort((a, b) => a.priority - b.priority);

    return {
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      expensesToday,
      expensesThisWeek,
      expensesThisMonth,
      cashBalance,
      profitThisMonth,
      burnRate,
      runway,
      activeDeals,
      activeDealValue,
      marketingSpend,
      topExpenseCategories,
      alerts
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    trend,
    subtitle 
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    change?: string; 
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
  }) => (
    <Card 
      style={{ 
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <CardHeader 
        className="flex flex-row items-center justify-between pb-1"
        style={{ padding: 'var(--spacing-2) var(--spacing-3) 0' }}
      >
        <CardTitle 
          className="text-xs"
          style={{ 
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)'
          }}
        >
          {title}
        </CardTitle>
        <Icon 
          className="h-3 w-3" 
          style={{ color: 'var(--muted-foreground)' }}
        />
      </CardHeader>
      <CardContent style={{ padding: '0 var(--spacing-3) var(--spacing-2)' }}>
        <div 
          className="text-lg sm:text-xl"
          style={{ 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)'
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p 
            className="text-[10px] sm:text-xs mt-0.5"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subtitle}
          </p>
        )}
        {change && trend && (
          <div 
            className="flex items-center text-[10px] sm:text-xs mt-0.5"
            style={{ 
              gap: 'var(--spacing-1)',
              color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--destructive)' : 'var(--muted-foreground)'
            }}
          >
            {trend === 'up' && <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            {trend === 'down' && <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        style={{ gap: 'var(--spacing-2) var(--spacing-3)' }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card 
            key={i}
            style={{ 
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <CardContent 
              className="h-20 flex items-center justify-center"
              style={{ padding: 'var(--spacing-2)' }}
            >
              <Activity 
                className="h-4 w-4 animate-pulse" 
                style={{ color: 'var(--muted-foreground)' }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 
          className="text-base sm:text-lg"
          style={{ 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)'
          }}
        >
          Business Overview
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: 'var(--spacing-1) var(--spacing-2)',
            height: 'auto'
          }}
        >
          <RefreshCw 
            className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
            style={{ color: 'var(--muted-foreground)' }}
          />
        </Button>
      </div>

      {/* Alerts Section */}
      {metrics.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {metrics.alerts.slice(0, 2).map((alert, index) => (
            <div
              key={index}
              style={{
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: alert.type === 'danger' 
                  ? 'rgba(212, 24, 61, 0.1)' 
                  : alert.type === 'warning' 
                  ? 'rgba(234, 179, 8, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
                borderLeft: `3px solid ${
                  alert.type === 'danger' 
                    ? 'var(--destructive)' 
                    : alert.type === 'warning' 
                    ? '#eab308'
                    : '#3b82f6'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <AlertTriangle 
                className="h-3 w-3 flex-shrink-0" 
                style={{ 
                  color: alert.type === 'danger' 
                    ? 'var(--destructive)' 
                    : alert.type === 'warning' 
                    ? '#eab308'
                    : '#3b82f6'
                }}
              />
              <span 
                className="text-xs sm:text-sm"
                style={{ 
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)'
                }}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Metrics Grid - More columns for better overview */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        style={{ gap: 'var(--spacing-2) var(--spacing-3)' }}
      >
        <MetricCard
          title="Cash Balance"
          value={formatCurrency(metrics.cashBalance)}
          icon={DollarSign}
          subtitle="Available funds"
        />

        <MetricCard
          title="Revenue This Month"
          value={formatCurrency(metrics.revenueThisMonth)}
          icon={TrendingUp}
          subtitle={`Today: ${formatCurrency(metrics.revenueToday)}`}
        />

        <MetricCard
          title="Expenses This Month"
          value={formatCurrency(metrics.expensesThisMonth)}
          icon={CreditCard}
          subtitle={`Today: ${formatCurrency(metrics.expensesToday)}`}
        />

        <MetricCard
          title="Profit This Month"
          value={formatCurrency(metrics.profitThisMonth)}
          icon={Activity}
          trend={metrics.profitThisMonth > 0 ? 'up' : metrics.profitThisMonth < 0 ? 'down' : 'neutral'}
          change={`${metrics.profitThisMonth >= 0 ? '+' : ''}${formatCurrency(metrics.profitThisMonth)}`}
        />

        <MetricCard
          title="Burn Rate"
          value={formatCurrency(metrics.burnRate)}
          icon={Flame}
          subtitle="Monthly average"
        />

        <MetricCard
          title="Runway"
          value={metrics.runway > 0 ? `${metrics.runway.toFixed(1)} months` : 'N/A'}
          icon={Activity}
          subtitle="At current burn rate"
        />

        <MetricCard
          title="Active Deals"
          value={metrics.activeDeals.toString()}
          icon={Target}
          subtitle={`Value: ${formatCurrency(metrics.activeDealValue)}`}
        />

        <MetricCard
          title="Marketing Spend"
          value={formatCurrency(metrics.marketingSpend)}
          icon={Megaphone}
          subtitle="Total campaign budgets"
        />
      </div>

      {/* Top Expense Categories - More compact */}
      {metrics.topExpenseCategories.length > 0 && (
        <Card 
          style={{ 
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <CardHeader style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
            <CardTitle 
              className="text-sm"
              style={{ 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)'
              }}
            >
              Top Expenses This Month
            </CardTitle>
          </CardHeader>
          <CardContent 
            style={{ 
              padding: '0 var(--spacing-3) var(--spacing-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-1)'
            }}
          >
            {metrics.topExpenseCategories.slice(0, 3).map((category, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <span 
                  className="text-xs"
                  style={{ 
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)'
                  }}
                >
                  {category.category}
                </span>
                <span 
                  className="text-xs"
                  style={{ 
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)'
                  }}
                >
                  {formatCurrency(category.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};