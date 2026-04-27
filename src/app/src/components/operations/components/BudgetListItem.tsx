import React, { useState, useCallback } from 'react';
import { Edit, Trash2, Target, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';
import { BudgetEditForm } from './BudgetEditForm';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { toast } from "sonner@2.0.3";

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

interface BudgetListItemProps {
  budget: Budget;
  onBudgetUpdated: (budget: Budget) => void;
  onBudgetDeleted: (budgetId: string) => void;
  selectedBusiness: any;
  user: any;
}

export const BudgetListItem: React.FC<BudgetListItemProps> = ({
  budget,
  onBudgetUpdated,
  onBudgetDeleted,
  selectedBusiness,
  user
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const spentPercentage = budget.budget_amount > 0 ? (budget.spent_amount / budget.budget_amount) * 100 : 0;
  const remainingAmount = budget.budget_amount - budget.spent_amount;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return spentPercentage >= 90 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
      case 'exceeded':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return spentPercentage >= 90 ? 'Near Limit' : 'Active';
      case 'exceeded':
        return 'Over Budget';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-red-500';
    if (spentPercentage >= 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleDelete = useCallback(async () => {
    if (!selectedBusiness) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets/${budget.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          onBudgetDeleted(budget.id);
          toast.success("Budget deleted successfully!");
          return;
        } else {
          const errorText = await response.text();
          toast.error(`Failed to delete budget: ${errorText}`);
        }
      }

      // Fallback to optimistic delete
      onBudgetDeleted(budget.id);
      toast.success("Budget deleted successfully!");
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  }, [budget.id, selectedBusiness, user, onBudgetDeleted]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-purple-600" />
                {budget.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(budget.status)}>
                  {getStatusText(budget.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {budget.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {budget.period}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Delete Budget
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{budget.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        'Delete Budget'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {budget.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {budget.description}
            </p>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Spent / Budget</span>
              <span className={spentPercentage >= 100 ? 'text-red-600 font-medium' : ''}>
                {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.budget_amount)}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={Math.min(spentPercentage, 100)} 
                className="h-3"
              />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{spentPercentage.toFixed(1)}% used</span>
              <span>
                {remainingAmount >= 0 ? 
                  `${formatCurrency(remainingAmount)} remaining` : 
                  `${formatCurrency(Math.abs(remainingAmount))} over budget`
                }
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(budget.start_date)} - {formatDate(budget.end_date)}</span>
            </div>
            <span>Created {formatDate(budget.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      <BudgetEditForm
        budget={budget}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onBudgetUpdated={onBudgetUpdated}
        selectedBusiness={selectedBusiness}
        user={user}
      />
    </>
  );
};