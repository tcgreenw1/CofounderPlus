import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface QuickStatsWidgetProps {
  businessId: string;
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({ businessId }) => {
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    isLoading: true
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !businessId) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/${businessId}/summary`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats({
            revenue: data.totalRevenue || 0,
            expenses: data.totalExpenses || 0,
            profit: (data.totalRevenue || 0) - (data.totalExpenses || 0),
            isLoading: false
          });
        } else {
          setStats(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading quick stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, [businessId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      label: 'Revenue',
      value: stats.revenue,
      icon: TrendingUp,
      color: 'var(--success)'
    },
    {
      label: 'Expenses',
      value: stats.expenses,
      icon: TrendingDown,
      color: 'var(--destructive)'
    },
    {
      label: 'Profit',
      value: stats.profit,
      icon: DollarSign,
      color: stats.profit >= 0 ? 'var(--success)' : 'var(--destructive)'
    }
  ];

  return (
    <Card
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden'
      }}
    >
      <CardHeader>
        <CardTitle 
          className="flex items-center gap-2"
          style={{ color: 'var(--foreground)' }}
        >
          <Activity 
            className="w-5 h-5"
            style={{ color: 'var(--primary)' }}
          />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.isLoading ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Loading stats...
          </div>
        ) : (
          <div className="space-y-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${stat.color}20`,
                      color: stat.color
                    }}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span 
                    className="font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {stat.label}
                  </span>
                </div>
                <span 
                  className="font-semibold"
                  style={{ color: stat.color }}
                >
                  {formatCurrency(stat.value)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
