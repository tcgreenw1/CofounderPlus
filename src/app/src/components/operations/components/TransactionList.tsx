import React from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  reference?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionRow: React.FC<{ transaction: Transaction }> = React.memo(({ transaction }) => {
  const isIncome = transaction.type === 'income';
  const IconComponent = isIncome ? TrendingUp : TrendingDown;
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          <IconComponent className={`w-4 h-4 ${
            isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`} />
        </div>
        <div>
          <h4 className="font-medium">{transaction.description}</h4>
          <p className="text-sm text-gray-500">
            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-semibold ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIncome ? '+' : '-'}${transaction.amount.toLocaleString()}
          </p>
          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
            {transaction.status}
          </Badge>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

export const TransactionList: React.FC<TransactionListProps> = React.memo(({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No transactions found. Add your first transaction to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});