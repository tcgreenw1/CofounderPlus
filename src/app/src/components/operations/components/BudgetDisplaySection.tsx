import React from 'react';
import { Target } from 'lucide-react';
import { BudgetListItem } from './BudgetListItem';

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

interface BudgetDisplaySectionProps {
  budgets: Budget[];
  onBudgetUpdated: (budget: Budget) => void;
  onBudgetDeleted: (budgetId: string) => void;
  selectedBusiness: any;
  user: any;
}

export const BudgetDisplaySection: React.FC<BudgetDisplaySectionProps> = ({
  budgets,
  onBudgetUpdated,
  onBudgetDeleted,
  selectedBusiness,
  user
}) => {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No budgets created yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create your first budget to start tracking expenses against spending limits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-medium">Budget Management</h3>
        <span className="text-sm text-gray-500">({budgets.length} budgets)</span>
      </div>
      
      <div className="grid gap-4">
        {budgets.map((budget) => (
          <BudgetListItem
            key={budget.id}
            budget={budget}
            onBudgetUpdated={onBudgetUpdated}
            onBudgetDeleted={onBudgetDeleted}
            selectedBusiness={selectedBusiness}
            user={user}
          />
        ))}
      </div>
    </div>
  );
};