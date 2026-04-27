import React, { useState, useCallback } from 'react';
import { CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from "sonner@2.0.3";
import { BUDGET_CATEGORIES, DEFAULT_BUDGET_CATEGORY } from '../constants/financeConstants';

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

interface BudgetFormProps {
  onBudgetAdded: (budget: Budget) => void;
  selectedBusiness: any;
  user: any;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ onBudgetAdded, selectedBusiness, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: DEFAULT_BUDGET_CATEGORY,
    budget_amount: 0,
    period: 'monthly' as const,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets?businessId=${selectedBusiness.id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formData)
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result && result.budget) {
              onBudgetAdded(result.budget);
              toast.success("Budget created successfully!");
              return;
            }
          } else {
            const errorText = await response.text();
            console.error('Server error creating budget:', errorText);
            toast.error(`Failed to create budget: ${errorText.substring(0, 100)}`);
          }
        } catch (fetchError: any) {
          console.error('Network error creating budget:', fetchError);
          toast.error(`Network error: ${fetchError.message}`);
        }
      }

      // Fallback to local state
      const budget: Budget = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        budget_amount: formData.budget_amount,
        spent_amount: 0,
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'active',
        created_at: new Date().toISOString()
      };

      onBudgetAdded(budget);
      toast.success("Budget created (saved locally)");
    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast.error(`Error: ${error.message || 'Failed to create budget'}`);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedBusiness, user, onBudgetAdded]);

  return (
    <div 
      className="space-y-3 sm:space-y-4 md:space-y-6"
      style={{
        gap: 'var(--spacing-3)'
      }}
    >
      <div>
        <Label 
          htmlFor="name" 
          className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
          style={{ fontWeight: 500 }}
        >
          Budget Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., Marketing Budget"
          className="text-sm sm:text-base h-8 sm:h-10 md:h-12"
          style={{
            borderColor: 'var(--color-border)',
            borderRadius: 'var(--radius-md)'
          }}
        />
      </div>

      <div>
        <Label 
          htmlFor="category" 
          className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
          style={{ fontWeight: 500 }}
        >
          Budget Category
        </Label>
        <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
          <SelectTrigger 
            className="h-8 sm:h-10 md:h-12 text-sm sm:text-base"
            style={{
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <SelectValue placeholder="Select a budget category" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px] sm:max-h-[300px]">
            {BUDGET_CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              return (
                <SelectItem key={category.value} value={category.value} className="py-2">
                  <div className="flex items-start gap-2">
                    <IconComponent className="w-4 h-4 mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm" style={{ fontWeight: 500 }}>{category.label}</span>
                      <span className="text-xs leading-tight hidden sm:block" style={{ color: 'var(--color-muted-foreground)' }}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div>
          <Label 
            htmlFor="budget_amount" 
            className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
            style={{ fontWeight: 500 }}
          >
            Budget Amount
          </Label>
          <div className="relative">
            <span 
              className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              $
            </span>
            <Input
              id="budget_amount"
              type="number"
              step="0.01"
              value={formData.budget_amount || ''}
              onChange={(e) => updateFormData('budget_amount', Number(e.target.value))}
              placeholder="0.00"
              className="pl-6 sm:pl-8 text-sm sm:text-base h-8 sm:h-10 md:h-12"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
        </div>

        <div>
          <Label 
            htmlFor="period" 
            className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
            style={{ fontWeight: 500 }}
          >
            Period
          </Label>
          <Select value={formData.period} onValueChange={(value) => updateFormData('period', value)}>
            <SelectTrigger 
              className="h-8 sm:h-10 md:h-12 text-sm sm:text-base"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div>
          <Label 
            htmlFor="start_date" 
            className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
            style={{ fontWeight: 500 }}
          >
            Start Date
          </Label>
          <div className="relative">
            <Calendar 
              className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => updateFormData('start_date', e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base h-8 sm:h-10 md:h-12"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
        </div>

        <div>
          <Label 
            htmlFor="end_date" 
            className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
            style={{ fontWeight: 500 }}
          >
            End Date
          </Label>
          <div className="relative">
            <Calendar 
              className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => updateFormData('end_date', e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base h-8 sm:h-10 md:h-12"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <Label 
          htmlFor="description" 
          className="text-sm sm:text-base mb-1.5 sm:mb-2 block"
          style={{ fontWeight: 500 }}
        >
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe what this budget is for..."
          className="min-h-16 sm:min-h-20 text-sm sm:text-base"
          style={{
            borderColor: 'var(--color-border)',
            borderRadius: 'var(--radius-md)'
          }}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSubmit}
          disabled={!formData.name || !formData.budget_amount || loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-8 sm:h-9 md:h-10 text-sm sm:text-base px-3 sm:px-4"
          style={{
            borderRadius: 'var(--radius-md)'
          }}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Budget
            </>
          )}
        </Button>
      </div>
    </div>
  );
};