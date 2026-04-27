import React, { useState } from 'react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Sparkles,
  Tag,
  Copy,
  ArrowLeftRight,
  FileText,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AGIActionBarProps {
  onAction: (action: string) => Promise<void>;
  transactionCount?: number;
}

interface AGIAction {
  id: string;
  label: string;
  icon: any;
  description: string;
  whatItDoes: string[];
  warning?: string;
}

export function AGIActionBar({ onAction, transactionCount = 0 }: AGIActionBarProps) {
  const [selectedAction, setSelectedAction] = useState<AGIAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const actions: AGIAction[] = [
    {
      id: 'auto-categorize',
      label: 'Auto-Categorize All',
      icon: Tag,
      description: 'Automatically categorize all uncategorized transactions using AGI',
      whatItDoes: [
        `Analyze ${transactionCount} uncategorized transactions`,
        'Match transaction descriptions to IRS-compliant categories',
        'Apply learned patterns from previous categorizations',
        'Tag transactions with confidence scores',
        'Create activity log entries for audit trail'
      ],
      warning: 'You can review and edit any categorization after this process.'
    },
    {
      id: 'auto-create-rules',
      label: 'Auto-Create Rules',
      icon: Sparkles,
      description: 'Generate smart categorization rules based on transaction patterns',
      whatItDoes: [
        'Analyze transaction history to identify patterns',
        'Create rules for recurring vendors and merchants',
        'Set up automatic categorization for future transactions',
        'Group similar transaction types together',
        'Enable auto-apply for high-confidence rules'
      ],
      warning: 'Rules can be reviewed and edited in the Categorization Rules tab.'
    },
    {
      id: 'detect-duplicates',
      label: 'Detect Duplicates',
      icon: Copy,
      description: 'Find and flag potential duplicate transactions',
      whatItDoes: [
        'Compare transactions by amount, date, and description',
        'Identify exact matches and near-duplicates',
        'Flag transactions within 3 days with same amount',
        'Create a review list of potential duplicates',
        'Suggest which transactions to keep or merge'
      ],
      warning: 'No transactions will be deleted automatically. You\'ll review all suggestions.'
    },
    {
      id: 'match-transfers',
      label: 'Match Transfers',
      icon: ArrowLeftRight,
      description: 'Identify and link internal transfers between accounts',
      whatItDoes: [
        'Find matching debit/credit pairs with same amounts',
        'Link transfers between checking, savings, and credit accounts',
        'Exclude transfers from income/expense calculations',
        'Mark transfer transactions with special tag',
        'Clean up financial reports by removing double-counting'
      ],
      warning: 'Transfer matching helps avoid inflating income/expense totals.'
    },
    {
      id: 'prepare-tax-summary',
      label: 'Prepare Tax Summary',
      icon: FileText,
      description: 'Generate comprehensive tax summary report',
      whatItDoes: [
        'Categorize all transactions by IRS Schedule C line items',
        'Calculate total deductible expenses by category',
        'Generate quarterly estimated tax calculations',
        'Create transaction summary by tax category',
        'Prepare export-ready tax package (PDF + CSV)'
      ],
      warning: 'This will analyze all transactions for the current tax year.'
    },
    {
      id: 'explain-month',
      label: 'Explain This Month',
      icon: MessageSquare,
      description: 'Get plain English explanation of monthly financial activity',
      whatItDoes: [
        'Summarize income and expenses in simple terms',
        'Identify top spending categories',
        'Highlight unusual or notable transactions',
        'Compare to previous months and trends',
        'Provide insights and recommendations'
      ],
      warning: 'This will open an AGI conversation with pre-loaded context.'
    }
  ];

  const handleActionClick = (action: AGIAction) => {
    setSelectedAction(action);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      await onAction(selectedAction.id);
      toast.success(`${selectedAction.label} completed successfully!`);
      setShowModal(false);
    } catch (error) {
      console.error('AGI Action error:', error);
      toast.error(`Failed to complete ${selectedAction.label}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedAction(null);
  };

  return (
    <>
      {/* AGI Action Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            AGI Financial Assistant
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleActionClick(action)}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-700"
              >
                <IconComponent className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-purple-600" />
                <span className="text-xs truncate">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedAction && (
                <>
                  {React.createElement(selectedAction.icon, {
                    className: 'w-5 h-5 text-purple-600'
                  })}
                  {selectedAction.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAction && (
            <div className="space-y-4 py-4">
              {/* What it does */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  What AGI will do:
                </h4>
                <ul className="space-y-2 ml-6">
                  {selectedAction.whatItDoes.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning */}
              {selectedAction.warning && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {selectedAction.warning}
                    </p>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        AGI is processing your request...
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        This may take a few moments depending on the data volume.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Confirm & Run
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
