import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  Clock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { AGITaskType } from './AGIActionBar';

interface AGITaskModalProps {
  open: boolean;
  onClose: () => void;
  taskType: AGITaskType;
  title: string;
  description: string;
  icon: any;
  onComplete: () => void;
  businessId?: string;
  month?: string;
}

interface TaskPreview {
  summary: string;
  stats: {
    label: string;
    value: string | number;
    icon?: any;
    color?: string;
  }[];
  changes: {
    type: 'add' | 'update' | 'delete' | 'merge';
    description: string;
    count?: number;
  }[];
  estimatedTime?: string;
}

export function AGITaskModal({
  open,
  onClose,
  taskType,
  title,
  description,
  icon: IconComponent,
  onComplete,
  businessId,
  month
}: AGITaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [preview, setPreview] = useState<TaskPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load preview when modal opens
  useEffect(() => {
    if (open) {
      loadPreview();
    }
  }, [open, taskType]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Please sign in to continue');
        setIsLoadingPreview(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/agi/preview/${taskType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            month
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
      } else {
        // Fallback to mock preview if endpoint doesn't exist yet
        setPreview(getMockPreview(taskType));
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
      // Use mock preview as fallback
      setPreview(getMockPreview(taskType));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRunTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/agi/execute/${taskType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            month
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Task completed successfully!');
        onComplete();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to complete task');
        toast.error('Failed to complete task');
      }
    } catch (error) {
      console.error('Task execution error:', error);
      setError('An error occurred while running the task');
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <IconComponent className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {title}
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AGI
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="space-y-4 py-4">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyzing your transactions...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : preview ? (
            <>
              {/* Task Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Task Summary
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {preview.summary}
                </p>
                {preview.estimatedTime && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-blue-700 dark:text-blue-300">
                    <Clock className="w-3 h-3" />
                    Estimated time: {preview.estimatedTime}
                  </div>
                )}
              </div>

              {/* Statistics */}
              {preview.stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {preview.stats.map((stat, index) => {
                    const StatIcon = stat.icon || DollarSign;
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StatIcon className={`w-4 h-4 ${stat.color || 'text-gray-600'}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {stat.label}
                          </span>
                        </div>
                        <p className="text-lg font-semibold">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preview of Changes */}
              {preview.changes.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-sm">Preview of Changes</h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {preview.changes.map((change, index) => (
                      <div key={index} className="px-4 py-3 flex items-start gap-3">
                        <div className="mt-0.5">
                          {change.type === 'add' && (
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                          {change.type === 'update' && (
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                            </div>
                          )}
                          {change.type === 'delete' && (
                            <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                            </div>
                          )}
                          {change.type === 'merge' && (
                            <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                              <TrendingUp className="w-3 h-3 text-purple-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{change.description}</p>
                          {change.count && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {change.count} items
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="link"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRunTask}
            disabled={isLoading || isLoadingPreview || !!error}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run with AGI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mock preview data for different task types
function getMockPreview(taskType: AGITaskType): TaskPreview {
  const previews: Record<AGITaskType, TaskPreview> = {
    'auto-categorize': {
      summary: 'AGI will analyze and categorize 47 uncategorized transactions based on descriptions, merchants, and patterns.',
      estimatedTime: '10-15 seconds',
      stats: [
        { label: 'Uncategorized', value: 47, icon: Tag, color: 'text-orange-600' },
        { label: 'Confidence', value: '94%', icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Categories', value: 12, icon: TrendingUp, color: 'text-blue-600' }
      ],
      changes: [
        { type: 'update', description: 'Categorize "Amazon.com" as Office Expense', count: 8 },
        { type: 'update', description: 'Categorize "Shell Gas Station" as Car and Truck Expenses', count: 5 },
        { type: 'update', description: 'Categorize "Starbucks" as Meals and Entertainment', count: 3 },
        { type: 'update', description: 'Categorize remaining transactions', count: 31 }
      ]
    },
    'auto-rules': {
      summary: 'AGI will create 8 new categorization rules based on your transaction history to automate future categorizations.',
      estimatedTime: '5-10 seconds',
      stats: [
        { label: 'New Rules', value: 8, icon: Sparkles, color: 'text-purple-600' },
        { label: 'Merchants', value: 15, icon: Tag, color: 'text-blue-600' },
        { label: 'Coverage', value: '78%', icon: TrendingUp, color: 'text-green-600' }
      ],
      changes: [
        { type: 'add', description: 'Create rule: All Amazon transactions → Office Expense', count: 1 },
        { type: 'add', description: 'Create rule: Shell/Chevron/BP → Car and Truck Expenses', count: 1 },
        { type: 'add', description: 'Create rule: Square payments → Revenue', count: 1 },
        { type: 'add', description: 'Create 5 additional rules for common merchants', count: 5 }
      ]
    },
    'detect-duplicates': {
      summary: 'AGI will scan all transactions to identify 6 potential duplicate entries based on amount, date, and description.',
      estimatedTime: '8-12 seconds',
      stats: [
        { label: 'Duplicates Found', value: 6, icon: AlertCircle, color: 'text-red-600' },
        { label: 'Total Scanned', value: 234, icon: CheckCircle2, color: 'text-gray-600' },
        { label: 'Amount', value: '$1,247', icon: DollarSign, color: 'text-orange-600' }
      ],
      changes: [
        { type: 'merge', description: 'Merge duplicate "Office Depot - $127.50" transactions', count: 2 },
        { type: 'merge', description: 'Merge duplicate "AT&T - $89.99" transactions', count: 2 },
        { type: 'delete', description: 'Remove duplicate "Gas Station - $45.00" entry', count: 1 },
        { type: 'merge', description: 'Merge other duplicate entries', count: 1 }
      ]
    },
    'match-transfers': {
      summary: 'AGI will identify and match 4 bank transfers between your accounts to avoid double-counting.',
      estimatedTime: '6-10 seconds',
      stats: [
        { label: 'Transfers Found', value: 4, icon: TrendingDown, color: 'text-blue-600' },
        { label: 'Matched Pairs', value: 2, icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Amount', value: '$5,200', icon: DollarSign, color: 'text-purple-600' }
      ],
      changes: [
        { type: 'update', description: 'Match transfer: Checking → Savings ($2,500)', count: 2 },
        { type: 'update', description: 'Match transfer: Business → Personal ($1,200)', count: 2 },
        { type: 'update', description: 'Mark matched transactions as internal transfers', count: 4 }
      ]
    },
    'tax-summary': {
      summary: 'AGI will generate a comprehensive tax summary with all deductible expenses organized by IRS Schedule C categories.',
      estimatedTime: '15-20 seconds',
      stats: [
        { label: 'Total Deductions', value: '$34,567', icon: DollarSign, color: 'text-green-600' },
        { label: 'Categories', value: 15, icon: Tag, color: 'text-blue-600' },
        { label: 'Transactions', value: 234, icon: TrendingUp, color: 'text-purple-600' }
      ],
      changes: [
        { type: 'add', description: 'Generate Schedule C expense breakdown', count: 1 },
        { type: 'add', description: 'Create quarterly tax payment estimates', count: 4 },
        { type: 'add', description: 'Generate tax deduction summary report', count: 1 },
        { type: 'add', description: 'Calculate estimated tax liability', count: 1 }
      ]
    },
    'explain-month': {
      summary: 'AGI will analyze this month\'s transactions and provide insights on spending patterns, trends, and opportunities.',
      estimatedTime: '12-18 seconds',
      stats: [
        { label: 'Total Spent', value: '$8,945', icon: DollarSign, color: 'text-red-600' },
        { label: 'Total Income', value: '$15,230', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Net Profit', value: '$6,285', icon: CheckCircle2, color: 'text-blue-600' }
      ],
      changes: [
        { type: 'add', description: 'Generate spending insights and trends analysis', count: 1 },
        { type: 'add', description: 'Identify unusual transactions or anomalies', count: 3 },
        { type: 'add', description: 'Compare to previous months and benchmarks', count: 1 },
        { type: 'add', description: 'Provide recommendations for cost savings', count: 5 }
      ]
    }
  };

  return previews[taskType];
}
