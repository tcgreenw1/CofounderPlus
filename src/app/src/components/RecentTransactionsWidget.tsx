import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart3, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
}

interface RecentTransactionsWidgetProps {
  businessId: string;
  maxItems?: number;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ 
  businessId,
  maxItems = 5 
}) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !businessId) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${businessId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Sort by date and take most recent
          const sorted = (data.transactions || [])
            .sort((a: Transaction, b: Transaction) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .slice(0, maxItems);
          setTransactions(sorted);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [businessId, maxItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
          <BarChart3 
            className="w-5 h-5"
            style={{ color: 'var(--success)' }}
          />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <p className="mb-3">No transactions yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operations/finance')}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              Add Transaction
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: transaction.type === 'income' 
                          ? 'rgba(var(--success-rgb, 108, 255, 108), 0.2)'
                          : 'rgba(var(--destructive-rgb, 255, 79, 79), 0.2)'
                      }}
                    >
                      <ArrowUp 
                        className={`w-4 h-4 ${transaction.type === 'expense' ? 'rotate-180' : ''}`}
                        style={{
                          color: transaction.type === 'income' ? 'var(--success)' : 'var(--destructive)'
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium truncate"
                        style={{ 
                          color: 'var(--foreground)',
                          fontSize: '0.875rem'
                        }}
                      >
                        {transaction.description || 'Transaction'}
                      </div>
                      <div 
                        style={{ 
                          color: 'var(--muted-foreground)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <div 
                    className="font-semibold flex-shrink-0"
                    style={{
                      color: transaction.type === 'income' ? 'var(--success)' : 'var(--destructive)',
                      fontSize: '0.875rem'
                    }}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </motion.div>
              ))}
            </div>
            {transactions.length >= maxItems && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/operations/finance')}
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                View All Transactions
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};