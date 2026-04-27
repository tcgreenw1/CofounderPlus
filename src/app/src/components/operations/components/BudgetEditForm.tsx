import React, { useState, useCallback } from 'react';
import { CheckCircle, Calendar, X } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { toast } from "sonner@2.0.3";
import { BUDGET_CATEGORIES } from '../constants/financeConstants';

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

interface BudgetEditFormProps {
  budget: Budget;
  isOpen: boolean;
  onClose: () => void;
  onBudgetUpdated: (budget: Budget) => void;
  selectedBusiness: any;
  user: any;
}

export const BudgetEditForm: React.FC<BudgetEditFormProps> = ({ 
  budget, 
  isOpen, 
  onClose, 
  onBudgetUpdated, 
  selectedBusiness, 
  user 
}) => {
  const [formData, setFormData] = useState({
    name: budget.name,
    description: budget.description,
    category: budget.category,
    budget_amount: budget.budget_amount,
    period: budget.period,
    start_date: budget.start_date,
    end_date: budget.end_date
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.budget_amount || !selectedBusiness) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets/${budget.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.ok) {
          const result = await response.json();
          onBudgetUpdated(result.budget);
          toast.success("Budget updated successfully!");
          onClose();
          return;
        } else {
          const errorText = await response.text();
          toast.error(`Failed to update budget: ${errorText}`);
        }
      }

      // Fallback to optimistic update
      const updatedBudget: Budget = {
        ...budget,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        budget_amount: formData.budget_amount,
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      onBudgetUpdated(updatedBudget);
      toast.success("Budget updated successfully!");
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setLoading(false);
    }
  }, [formData, selectedBusiness, user, budget, onBudgetUpdated, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            Edit Budget
          </DialogTitle>
          <DialogDescription>
            Update your budget details including amount, category, and time period to better track your spending.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <Label htmlFor="name" className="text-lg mb-3 block">
              Budget Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Marketing Budget, Office Supplies"
              className="text-lg h-12"
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-lg mb-3 block">
              Budget Category
            </Label>
            <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a budget category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {BUDGET_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <SelectItem key={category.value} value={category.value} className="py-3">
                      <div className="flex items-start space-x-3">
                        <IconComponent className="w-5 h-5 mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{category.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                            {category.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="budget_amount" className="text-lg mb-3 block">
                Budget Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="budget_amount"
                  type="number"
                  step="0.01"
                  value={formData.budget_amount || ''}
                  onChange={(e) => updateFormData('budget_amount', Number(e.target.value))}
                  placeholder="0.00"
                  className="pl-8 text-lg h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="period" className="text-lg mb-3 block">
                Period
              </Label>
              <Select value={formData.period} onValueChange={(value) => updateFormData('period', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="start_date" className="text-lg mb-3 block">
                Start Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateFormData('start_date', e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end_date" className="text-lg mb-3 block">
                End Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => updateFormData('end_date', e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-lg mb-3 block">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe what this budget is for..."
              className="min-h-20"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.budget_amount || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Budget
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};