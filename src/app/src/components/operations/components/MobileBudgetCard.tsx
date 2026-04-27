import React, { useState } from 'react';
import { 
  Target, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Calendar, DollarSign, MoreVertical,
  Edit, Trash2, PieChart, BarChart3, Settings,
  XCircle, Info
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { copyToClipboard } from '../../../utils/clipboard';

interface Budget {
  id: string;
  name: string;
  description: string;
  category: string;
  budget_amount: number;
  spent_amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  status: 'active' | 'exceeded' | 'completed';
  created_at: string;
}

interface MobileBudgetCardProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  onViewDetails?: (budget: Budget) => void;
  showActions?: boolean;
  isCompact?: boolean;
}

export function MobileBudgetCard({ 
  budget, 
  onEdit, 
  onDelete, 
  onViewDetails,
  showActions = true,
  isCompact = false 
}: MobileBudgetCardProps) {
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

  const calculatePercentage = () => {
    return (budget.spent_amount / budget.budget_amount) * 100;
  };

  const getStatusInfo = () => {
    const percentage = calculatePercentage();
    const isOverBudget = percentage > 100;
    const isNearLimit = percentage > 80 && percentage <= 100;
    
    if (isOverBudget) {
      return {
        status: 'exceeded',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        progressColor: 'bg-red-500',
        icon: <AlertTriangle className="mobile-icon-xs text-red-600" />,
        message: `Over budget by ${formatCurrency(budget.spent_amount - budget.budget_amount)}`
      };
    } else if (isNearLimit) {
      return {
        status: 'warning',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        progressColor: 'bg-yellow-500',
        icon: <AlertTriangle className="mobile-icon-xs text-yellow-600" />,
        message: `${(100 - percentage).toFixed(0)}% remaining`
      };
    } else {
      return {
        status: 'good',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        progressColor: 'bg-green-500',
        icon: <CheckCircle className="mobile-icon-xs text-green-600" />,
        message: `${(100 - percentage).toFixed(0)}% remaining`
      };
    }
  };

  const getPeriodLabel = () => {
    switch (budget.period) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return 'Period';
    }
  };

  const getDaysRemaining = () => {
    const endDate = new Date(budget.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day left';
    } else {
      return `${diffDays} days left`;
    }
  };

  const statusInfo = getStatusInfo();
  const percentage = calculatePercentage();

  if (isCompact) {
    return (
      <div className="space-y-2 mobile-list-item p-2 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="mobile-text-xs font-medium">{budget.name}</p>
            <p className="mobile-text-xs text-gray-500">{budget.category}</p>
          </div>
          <div className="text-right">
            <p className="mobile-text-xs font-medium">
              {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.budget_amount)}
            </p>
            <p className={`mobile-text-xs ${statusInfo.color}`}>
              {percentage.toFixed(0)}% used
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${statusInfo.progressColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-layout">
      <Card className={`mobile-card border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Target className="mobile-icon-sm text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="mobile-text-sm truncate">{budget.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="mobile-badge mobile-text-xs">
                    {budget.category}
                  </Badge>
                  <Badge variant="outline" className="mobile-badge mobile-text-xs">
                    {getPeriodLabel()}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {statusInfo.icon}
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
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {/* Budget Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="mobile-text-xs text-gray-600 dark:text-gray-400">Progress</span>
              <span className={`mobile-text-xs font-medium ${statusInfo.color}`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-2"
              style={{
                background: 'rgb(229 231 235)', // gray-200
              }}
            />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs text-gray-600 dark:text-gray-400">Spent</p>
                <p className="mobile-text-sm font-semibold">{formatCurrency(budget.spent_amount)}</p>
              </div>
              <div className="text-right">
                <p className="mobile-text-xs text-gray-600 dark:text-gray-400">Budget</p>
                <p className="mobile-text-sm font-semibold">{formatCurrency(budget.budget_amount)}</p>
              </div>
            </div>
            
            {/* Status Message */}
            <div className={`p-2 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
              <div className="flex items-center gap-2">
                {statusInfo.icon}
                <span className={`mobile-text-xs ${statusInfo.color}`}>
                  {statusInfo.message}
                </span>
              </div>
            </div>
            
            {/* Time Remaining */}
            <div className="flex items-center justify-between mobile-text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="mobile-icon-xs" />
                {getDaysRemaining()}
              </span>
              <span>
                Ends {new Date(budget.end_date).toLocaleDateString()}
              </span>
            </div>
            
            {/* Description */}
            {budget.description && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="mobile-text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {budget.description}
                </p>
              </div>
            )}
          </div>
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
                <h3 className="mobile-text-lg font-medium">Budget Options</h3>
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
                {onViewDetails && (
                  <Button 
                    onClick={() => {
                      onViewDetails(budget);
                      setShowOptionsMenu(false);
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm"
                  >
                    <BarChart3 className="mobile-icon-sm mr-2" />
                    View Details
                  </Button>
                )}
                
                {onEdit && (
                  <Button 
                    onClick={() => {
                      onEdit(budget);
                      setShowOptionsMenu(false);
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm"
                  >
                    <Edit className="mobile-icon-sm mr-2" />
                    Edit Budget
                  </Button>
                )}
                
                <Button 
                  onClick={async () => {
                    const success = await copyToClipboard(`Budget: ${budget.name} - ${formatCurrency(budget.spent_amount)}/${formatCurrency(budget.budget_amount)} (${percentage.toFixed(1)}%)`);
                    if (success) {
                      setShowOptionsMenu(false);
                    }
                  }}
                  variant="outline" 
                  className="w-full justify-start mobile-button mobile-text-sm"
                >
                  <Info className="mobile-icon-sm mr-2" />
                  Copy Summary
                </Button>
                
                {onDelete && (
                  <Button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this budget?')) {
                        onDelete(budget.id);
                        setShowOptionsMenu(false);
                      }
                    }}
                    variant="outline" 
                    className="w-full justify-start mobile-button mobile-text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="mobile-icon-sm mr-2" />
                    Delete Budget
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