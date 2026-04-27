import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
}

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingInvoices: number;
}

interface TransactionSummaryCardsProps {
  summaryData: SummaryData;
  transactions: Transaction[];
}

export const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({ summaryData, transactions }) => {
  const monthlyAverages = useMemo(() => {
    const now = new Date();
    
    const monthlyIn = Math.round(transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 12 && t.type === 'income' && t.status === 'completed';
      })
      .reduce((sum, t) => sum + t.amount, 0) / 12);
      
    const monthlyOut = Math.round(transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 12 && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0) / 12);
      
    return {
      monthlyIn,
      monthlyOut,
      monthlyNet: monthlyIn - monthlyOut
    };
  }, [transactions]);

  const cards = [
    {
      title: 'Income',
      value: summaryData.totalIncome,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Expenses',
      value: summaryData.totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Pending',
      value: summaryData.pendingInvoices,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Net',
      value: summaryData.netIncome,
      icon: BarChart3,
      color: summaryData.netIncome >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summaryData.netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Monthly In',
      value: monthlyAverages.monthlyIn,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Monthly Out',
      value: monthlyAverages.monthlyOut,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Monthly Net',
      value: monthlyAverages.monthlyNet,
      icon: BarChart3,
      color: monthlyAverages.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthlyAverages.monthlyNet >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-1 sm:p-1.5 rounded-full ${card.bgColor}`}>
                <IconComponent className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 pt-0">
              <div className={`text-sm sm:text-lg font-bold ${card.color}`}>
                ${Math.abs(card.value).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
