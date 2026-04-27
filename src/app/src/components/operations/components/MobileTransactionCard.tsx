import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Calendar, Tag, CreditCard,
  MoreVertical, Edit, Trash2, Copy, ExternalLink,
  CheckCircle, Clock, XCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { copyToClipboard } from '../../../utils/clipboard';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  payment_method?: string;
  reference?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  scheduled_date?: string;
  is_future_transaction?: boolean;
}

interface MobileTransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onDuplicate?: (transaction: Transaction) => void;
  showActions?: boolean;
  isCompact?: boolean;
}

export function MobileTransactionCard({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate,
  showActions = true,
  isCompact = false 
}: MobileTransactionCardProps) {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const formatCurrency = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (abs >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="mobile-icon-xs text-green-500" />;
      case 'pending': return <Clock className="mobile-icon-xs text-yellow-500" />;
      case 'cancelled': return <XCircle className="mobile-icon-xs text-red-500" />;
      case 'scheduled': return <Calendar className="mobile-icon-xs text-blue-500" />;
      default: return <CheckCircle className="mobile-icon-xs text-green-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0 mobile-list-item">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div className="min-w-0 flex-1">
            <p className="mobile-text-xs font-medium truncate">{transaction.description}</p>
            <p className="mobile-text-xs text-gray-500">{transaction.category}</p>
          </div>
        </div>
        <div className={`text-right flex-shrink-0 ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          <p className="mobile-text-xs font-semibold">
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
          </p>
          {transaction.status && transaction.status !== 'completed' && (
            <p className="mobile-text-xs text-gray-500 capitalize">{transaction.status}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-layout">
      <Card className="mobile-card mobile-list-item">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Transaction Type Icon */}
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                transaction.type === 'income' 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {transaction.type === 'income' ? (
                  <TrendingUp className="mobile-icon-sm text-green-600" />
                ) : (
                  <TrendingDown className="mobile-icon-sm text-red-600" />
                )}
              </div>
              
              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="mobile-text-sm font-medium truncate pr-2">
                    {transaction.description}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getStatusIcon(transaction.status)}
                    {showActions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        className="mobile-button-small h-6 w-6 p-0"
                      >
                        <MoreVertical className="mobile-icon-xs" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Transaction Meta */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="mobile-badge mobile-text-xs">
                    {transaction.category}
                  </Badge>
                  {transaction.status && transaction.status !== 'completed' && (
                    <Badge className={`mobile-badge mobile-text-xs ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </Badge>
                  )}
                </div>
                
                {/* Amount and Date */}
                <div className="flex items-center justify-between">
                  <span className="mobile-text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="mobile-icon-xs" />
                    {transaction.is_future_transaction && transaction.scheduled_date 
                      ? `Scheduled: ${formatDate(transaction.scheduled_date)}`
                      : formatDate(transaction.date)
                    }
                  </span>
                  <span className={`mobile-text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
                
                {/* Additional Info */}
                {(transaction.payment_method || transaction.reference || transaction.tags?.length) && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2 mobile-text-xs text-gray-500">
                      {transaction.payment_method && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="mobile-icon-xs" />
                          {transaction.payment_method}
                        </span>
                      )}
                      {transaction.reference && (
                        <span className="flex items-center gap-1">
                          <Tag className="mobile-icon-xs" />
                          {transaction.reference}
                        </span>
                      )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex gap-1">
                          {transaction.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="mobile-badge mobile-text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {transaction.tags.length > 2 && (
                            <span className="mobile-text-xs text-gray-400">
                              +{transaction.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Future Transaction Warning */}
          {transaction.is_future_transaction && transaction.scheduled_date && 
           new Date(transaction.scheduled_date) <= new Date() && (
            <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="mobile-icon-xs text-orange-600" />
                <span className="mobile-text-xs text-orange-700 dark:text-orange-300">
                  This scheduled transaction is due for processing
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options Menu */}
      {showOptionsMenu && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowOptionsMenu(false)}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl mobile-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 mobile-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="mobile-text-lg font-medium">Transaction Options</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowOptionsMenu(false)}
                  className="mobile-button-small"
                >
                  <XCircle className="mobile-icon-sm" />
                </Button>
              </div>
              
              <div className="space-y-2 mobile-space-y-1">
                {onEdit && (
                  <Button 
                    onClick={() => {
                      onEdit(transaction);
                      setShowOptionsMenu(false);
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm"
                  >
                    <Edit className="mobile-icon-sm mr-2" />
                    Edit Transaction
                  </Button>
                )}
                
                {onDuplicate && (
                  <Button 
                    onClick={() => {
                      onDuplicate(transaction);
                      setShowOptionsMenu(false);
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm"
                  >
                    <Copy className="mobile-icon-sm mr-2" />
                    Duplicate
                  </Button>
                )}
                
                <Button 
                  onClick={async () => {
                    const success = await copyToClipboard(`${transaction.description}: ${formatCurrency(transaction.amount)}`);
                    if (success) {
                      setShowOptionsMenu(false);
                    }
                  }}
                  variant="outline" 
                  className="w-full justify-start mobile-button mobile-text-sm"
                >
                  <Copy className="mobile-icon-sm mr-2" />
                  Copy Details
                </Button>
                
                {onDelete && (
                  <Button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this transaction?')) {
                        onDelete(transaction.id);
                        setShowOptionsMenu(false);
                      }
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="mobile-icon-sm mr-2" />
                    Delete Transaction
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}