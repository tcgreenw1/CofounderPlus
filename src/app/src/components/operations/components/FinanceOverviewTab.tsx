import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  PieChart
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
}

interface BankBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

interface FinanceOverviewTabProps {
  transactions: Transaction[];
  bankBalance: BankBalance;
}

export function FinanceOverviewTab({ transactions, bankBalance }: FinanceOverviewTabProps) {
  // Calculate current month's metrics
  const monthlyMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        t.status === 'completed'
      );
    });

    // Calculate revenue (income)
    const revenue = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate expenses
    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate profit
    const profit = revenue - expenses;

    // Calculate top expense categories
    const categoryTotals: { [key: string]: number } = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0
      }));

    return {
      revenue,
      expenses,
      profit,
      topCategories
    };
  }, [transactions]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: bankBalance.currency || 'USD'
    }).format(amount);
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Cash Balance',
      value: formatCurrency(bankBalance.balance),
      icon: Wallet,
      color: 'var(--color-primary)',
      bgColor: 'var(--color-primary-soft)',
      change: null
    },
    {
      title: 'Revenue This Month',
      value: formatCurrency(monthlyMetrics.revenue),
      icon: TrendingUp,
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-soft)',
      change: null
    },
    {
      title: 'Expenses This Month',
      value: formatCurrency(monthlyMetrics.expenses),
      icon: TrendingDown,
      color: 'var(--color-chart-5)',
      bgColor: 'var(--color-muted)',
      change: null
    },
    {
      title: 'Profit This Month',
      value: formatCurrency(monthlyMetrics.profit),
      icon: DollarSign,
      color: monthlyMetrics.profit >= 0 ? 'var(--color-success)' : 'var(--color-destructive)',
      bgColor: monthlyMetrics.profit >= 0 ? 'var(--color-success-soft)' : 'var(--color-muted)',
      change: null
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-foreground)',
          marginBottom: 'var(--spacing-2)'
        }}>
          Finance Overview
        </h2>
        <p style={{ 
          fontSize: '0.875rem',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--color-muted-foreground)'
        }}>
          Your business financial health at a glance
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-4)'
      }}>
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card style={{ 
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-card)'
              }}>
                <CardContent style={{ padding: 'var(--spacing-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '0.875rem',
                        fontWeight: 'var(--font-weight-normal)',
                        color: 'var(--color-muted-foreground)',
                        marginBottom: 'var(--spacing-2)'
                      }}>
                        {stat.title}
                      </p>
                      <p style={{ 
                        fontSize: '1.875rem',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-foreground)',
                        lineHeight: 1.2
                      }}>
                        {stat.value}
                      </p>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon 
                        style={{ 
                          width: '24px', 
                          height: '24px',
                          color: stat.color
                        }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Top Expense Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card style={{ 
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-card)'
        }}>
          <CardHeader style={{ 
            padding: 'var(--spacing-5)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PieChart 
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    color: 'var(--color-primary)'
                  }} 
                />
              </div>
              <div>
                <CardTitle style={{
                  fontSize: '1.125rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-foreground)'
                }}>
                  Top Expense Categories
                </CardTitle>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginTop: 'var(--spacing-1)'
                }}>
                  This month's spending breakdown
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 'var(--spacing-5)' }}>
            {monthlyMetrics.topCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {monthlyMetrics.topCategories.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-foreground)'
                      }}>
                        {category.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-foreground)'
                        }}>
                          {formatCurrency(category.amount)}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--color-muted-foreground)',
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--color-muted)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)'
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-6)',
                color: 'var(--color-muted-foreground)'
              }}>
                <PieChart 
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    margin: '0 auto var(--spacing-3)',
                    opacity: 0.3
                  }} 
                />
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'var(--font-weight-normal)'
                }}>
                  No expenses recorded this month
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
