import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Shield,
  BarChart3,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface MonthlyCloseProps {
  user: any;
}

interface CloseStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  itemsToReview: number;
  agiSuggestions: string[];
}

interface FinancialSnapshot {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  topExpenseCategories: { category: string; amount: number }[];
  cashOnHand: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export function MonthlyClose({ user }: MonthlyCloseProps) {
  const { selectedBusiness } = useBusiness();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoResolving, setIsAutoResolving] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  
  const [steps, setSteps] = useState<CloseStep[]>([
    {
      id: 1,
      name: 'Review Transactions',
      description: 'Verify all transactions are properly categorized',
      status: 'pending',
      itemsToReview: 0,
      agiSuggestions: []
    },
    {
      id: 2,
      name: 'Reconcile Accounts',
      description: 'Match bank statements with recorded transactions',
      status: 'pending',
      itemsToReview: 0,
      agiSuggestions: []
    },
    {
      id: 3,
      name: 'Generate P&L',
      description: 'Create profit and loss statement',
      status: 'pending',
      itemsToReview: 0,
      agiSuggestions: []
    },
    {
      id: 4,
      name: 'Generate Balance Sheet',
      description: 'Compile assets, liabilities, and equity',
      status: 'pending',
      itemsToReview: 0,
      agiSuggestions: []
    },
    {
      id: 5,
      name: 'Approve Close',
      description: 'Final review and lock the period',
      status: 'pending',
      itemsToReview: 0,
      agiSuggestions: []
    }
  ]);

  const [financialSnapshot, setFinancialSnapshot] = useState<FinancialSnapshot>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    topExpenseCategories: [],
    cashOnHand: 0
  });

  useEffect(() => {
    if (selectedBusiness) {
      loadMonthlyCloseData();
    }
  }, [selectedBusiness, selectedMonth, selectedYear]);

  const loadMonthlyCloseData = async () => {
    if (!selectedBusiness) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/monthly-close?businessId=${selectedBusiness.id}&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.steps) setSteps(data.steps);
        if (data.snapshot) setFinancialSnapshot(data.snapshot);
      }
    } catch (error) {
      console.error('Failed to load monthly close data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoResolve = async (stepId: number) => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsAutoResolving(stepId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/auto-resolve-step`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            stepId,
            month: selectedMonth,
            year: selectedYear
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Step ${stepId} auto-resolved successfully!`);
        
        // Update the step status
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? { ...step, status: 'completed', itemsToReview: 0 }
              : step
          )
        );
        
        loadMonthlyCloseData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to auto-resolve step');
      }
    } catch (error) {
      console.error('Auto-resolve error:', error);
      toast.error('An error occurred while auto-resolving');
    } finally {
      setIsAutoResolving(null);
    }
  };

  const handleDownload = async (reportType: string) => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsDownloading(reportType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/download-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            reportType,
            month: selectedMonth,
            year: selectedYear
          })
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${MONTHS[selectedMonth]}_${selectedYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`${reportType} downloaded successfully!`);
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('An error occurred while downloading');
    } finally {
      setIsDownloading(null);
    }
  };

  const toggleStep = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Monthly Close</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete your month-end financial close process
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-gray-500">{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed</span>
              <span>{MONTHS[selectedMonth]} {selectedYear}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Workflow Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                    step.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {getStepIcon(step.status)}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[80px] hidden md:block">
                    {step.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    steps[index + 1].status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Cards */}
          {steps.map((step) => (
            <Card key={step.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <CardTitle className="text-base">
                        Step {step.id}: {step.name}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {step.itemsToReview > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        {step.itemsToReview} items
                      </Badge>
                    )}
                    <Badge
                      className={
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : step.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                    {expandedStep === step.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedStep === step.id && (
                <CardContent className="border-t pt-4">
                  <div className="space-y-4">
                    {/* Items to Review */}
                    {step.itemsToReview > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Items Needing Review
                        </h4>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {step.itemsToReview} {step.itemsToReview === 1 ? 'item requires' : 'items require'} your attention
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          No items require review
                        </p>
                      </div>
                    )}

                    {/* AGI Suggestions */}
                    {step.agiSuggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          AGI Suggestions
                        </h4>
                        <div className="space-y-2">
                          {step.agiSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
                            >
                              <p className="text-sm text-purple-800 dark:text-purple-200">
                                {suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-Resolve Button */}
                    {step.status !== 'completed' && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleAutoResolve(step.id)}
                          disabled={isAutoResolving === step.id}
                          className="bg-gradient-to-r from-[#00E0FF] to-[#4B00FF] hover:opacity-90"
                        >
                          {isAutoResolving === step.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Resolving...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Auto-Resolve with AGI
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Download Monthly Package */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Monthly Close Exports
              </CardTitle>
              <CardDescription>
                Export financial reports for {MONTHS[selectedMonth]} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDownload('P&L')}
                  disabled={isDownloading === 'P&L'}
                  className="justify-start"
                >
                  {isDownloading === 'P&L' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                  )}
                  Download P&L
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload('Balance Sheet')}
                  disabled={isDownloading === 'Balance Sheet'}
                  className="justify-start"
                >
                  {isDownloading === 'Balance Sheet' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                  )}
                  Download Balance Sheet
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload('Trial Balance')}
                  disabled={isDownloading === 'Trial Balance'}
                  className="justify-start"
                >
                  {isDownloading === 'Trial Balance' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2 text-green-500" />
                  )}
                  Download Trial Balance
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload('CSV Ledger')}
                  disabled={isDownloading === 'CSV Ledger'}
                  className="justify-start"
                >
                  {isDownloading === 'CSV Ledger' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-purple-500" />
                  )}
                  Download Full Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Financial Snapshot */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Financial Snapshot
              </CardTitle>
              <CardDescription>
                {MONTHS[selectedMonth]} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Income */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Income</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ${financialSnapshot.totalIncome.toLocaleString()}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  ${financialSnapshot.totalExpenses.toLocaleString()}
                </div>
              </div>

              {/* Net Profit */}
              <div className={`rounded-lg p-4 ${
                financialSnapshot.netProfit >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit</span>
                  <BarChart3 className={`w-4 h-4 ${
                    financialSnapshot.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${
                  financialSnapshot.netProfit >= 0
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  ${Math.abs(financialSnapshot.netProfit).toLocaleString()}
                </div>
                {financialSnapshot.netProfit < 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Loss</p>
                )}
              </div>

              {/* Cash on Hand */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cash on Hand</span>
                  <DollarSign className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  ${financialSnapshot.cashOnHand.toLocaleString()}
                </div>
              </div>

              {/* Top 5 Expense Categories */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Top 5 Expense Categories</h4>
                <div className="space-y-2">
                  {financialSnapshot.topExpenseCategories.length > 0 ? (
                    financialSnapshot.topExpenseCategories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-red-500' :
                            index === 1 ? 'bg-orange-500' :
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {cat.category}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          ${cat.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No expenses recorded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}