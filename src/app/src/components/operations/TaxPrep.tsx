import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Building2,
  AlertCircle,
  Brain,
  Loader2,
  FileSpreadsheet,
  Eye,
  MessageCircle
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { EstimatedQuarterlyTaxesCard } from '../EstimatedQuarterlyTaxesCard';

interface TaxPrepProps {
  user: any;
}

interface TaxChecklistItem {
  id: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
}

interface QuarterlyTaxEstimate {
  federal: number;
  state: number;
  nextDeadline: string;
  quarterName: string;
}

interface TaxCategory {
  code: string;
  name: string;
  totalAmount: number;
  transactionCount: number;
  transactions: Array<{
    id: string;
    date: string;
    vendor: string;
    description: string;
    amount: number;
  }>;
}

export function TaxPrep({ user }: TaxPrepProps) {
  const { selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaxCategory | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAGIPanel, setShowAGIPanel] = useState(false);

  // Initialize with empty data - will be populated from server
  const [checklist, setChecklist] = useState<TaxChecklistItem[]>([]);

  // Initialize with empty data - will be populated from server
  const [quarterlyEstimate, setQuarterlyEstimate] = useState<QuarterlyTaxEstimate>({
    federal: 0,
    state: 0,
    nextDeadline: '',
    quarterName: ''
  });

  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);

  useEffect(() => {
    if (selectedBusiness) {
      loadTaxData();
    }
  }, [selectedBusiness]);

  const loadTaxData = async () => {
    if (!selectedBusiness) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      console.log('📊 Loading tax data for business:', selectedBusiness.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/tax-data?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Tax data loaded:', data);
        
        // Only update if we have real data from the server
        if (data.checklist && data.checklist.length > 0) {
          setChecklist(data.checklist);
        } else {
          // Show empty state if no checklist items yet
          setChecklist([]);
        }
        
        if (data.quarterlyEstimate) {
          setQuarterlyEstimate(data.quarterlyEstimate);
        }
        
        if (data.categories && data.categories.length > 0) {
          setTaxCategories(data.categories);
        } else {
          setTaxCategories([]);
        }
      } else {
        console.warn('📊 Failed to load tax data - server returned:', response.status);
        // Keep empty data - don't use mock data
        setChecklist([]);
        setTaxCategories([]);
      }
    } catch (error) {
      console.error('Failed to load tax data:', error);
      // Keep empty data on error - don't use mock data
      setChecklist([]);
      setTaxCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsRecalculating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/recalculate-taxes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.estimate) setQuarterlyEstimate(data.estimate);
        toast.success('Tax estimates recalculated successfully!');
      } else {
        toast.error('Failed to recalculate taxes');
      }
    } catch (error) {
      console.error('Recalculate error:', error);
      toast.error('An error occurred while recalculating');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleGenerateTaxPackage = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/generate-tax-package`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            year: new Date().getFullYear()
          })
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax_package_${selectedBusiness.id}_${new Date().getFullYear()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Tax package downloaded successfully!');
      } else {
        toast.error('Failed to generate tax package');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('An error occurred while generating tax package');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDetails = (category: TaxCategory) => {
    setSelectedCategory(category);
    setShowTransactionModal(true);
  };

  const handleExplainTaxes = () => {
    setShowAGIPanel(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCompletionPercentage = () => {
    const completed = checklist.filter(item => item.status === 'completed').length;
    return (completed / checklist.length) * 100;
  };

  const getNextQuarterDeadline = () => {
    const now = new Date();
    const year = now.getFullYear();
    const deadlines = [
      { date: new Date(year, 3, 15), name: 'Q1' }, // April 15
      { date: new Date(year, 5, 15), name: 'Q2' }, // June 15
      { date: new Date(year, 8, 15), name: 'Q3' }, // September 15
      { date: new Date(year, 0, 15), name: 'Q4' }  // January 15 of next year
    ];

    for (const deadline of deadlines) {
      if (deadline.date > now) {
        return deadline;
      }
    }
    return { date: new Date(year + 1, 0, 15), name: 'Q4' };
  };

  const nextDeadline = getNextQuarterDeadline();
  const daysUntilDeadline = Math.ceil((nextDeadline.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Business Tax Automation</h2>
        <p className="text-sm text-gray-500 mt-1">
          Let AGI handle your business tax preparation and filing
        </p>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* AI Tax Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Tax Checklist
              </CardTitle>
              <CardDescription>
                AGI-powered tasks for complete tax preparation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-gray-500">{Math.round(getCompletionPercentage())}%</span>
                </div>
                <Progress value={getCompletionPercentage()} className="h-2" />
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          item.status === 'completed' ? 'line-through text-gray-500' : ''
                        }`}>
                          {item.task}
                        </p>
                        {item.status === 'in_progress' && (
                          <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estimated Quarterly Taxes */}
          <EstimatedQuarterlyTaxesCard
            businessId={selectedBusiness?.id}
            year={new Date().getFullYear()}
            quarter={parseInt(nextDeadline.name.replace('Q', ''))}
            onRecalculate={loadTaxData}
          />
        </div>

        {/* Right Panel - Tax Category Mapping */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Tax Category Mapping
              </CardTitle>
              <CardDescription>
                IRS Schedule C expense breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxCategories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IRS Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction Count
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {taxCategories.map((category) => (
                        <tr key={category.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {category.code}
                              </Badge>
                              <span className="text-sm font-medium">
                                {category.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              ${category.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {category.transactionCount}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleViewDetails(category)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No tax categories available</p>
                  <p className="text-sm text-gray-400">
                    Run auto-bookkeeping to generate tax categories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Action Buttons */}
      <div className="flex flex-col items-center gap-4 py-6 border-t">
        {/* Generate Tax Package Button */}
        <Button
          onClick={handleGenerateTaxPackage}
          disabled={isGenerating}
          size="lg"
          className="w-full max-w-md h-14 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Package...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate Tax Package (PDF + CSV)
            </>
          )}
        </Button>

        {/* Explain My Taxes Link */}
        <Button
          variant="link"
          onClick={handleExplainTaxes}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Explain My Taxes (Open AGI Panel)
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory?.code}: {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.transactionCount} transactions totaling ${selectedCategory?.totalAmount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Vendor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCategory?.transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {transaction.vendor}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right">
                        ${transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionModal(false)}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Brain className="w-4 h-4 mr-2" />
              Fix with AGI
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AGI Tax Explanation Panel */}
      <Dialog open={showAGIPanel} onOpenChange={setShowAGIPanel}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Tax Explanation - AGI Assistant
            </DialogTitle>
            <DialogDescription>
              Ask me anything about your business taxes
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Pre-loaded Tax Context */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    I've analyzed your tax situation. Here's what I found:
                  </p>
                  <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                    <li>• Total deductible expenses: ${taxCategories.reduce((sum, cat) => sum + cat.totalAmount, 0).toLocaleString()}</li>
                    <li>• Estimated quarterly payment: ${(quarterlyEstimate.federal + quarterlyEstimate.state).toLocaleString()}</li>
                    <li>• Next deadline: {nextDeadline.date.toLocaleDateString()} ({daysUntilDeadline} days)</li>
                    <li>• {checklist.filter(item => item.status === 'completed').length} of {checklist.length} tax tasks completed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            <div>
              <p className="text-sm font-medium mb-3">Suggested Questions:</p>
              <div className="space-y-2">
                {[
                  'What expenses can I deduct?',
                  'How are my quarterly taxes calculated?',
                  'What happens if I miss a quarterly payment?',
                  'Can I deduct home office expenses?',
                  'What records do I need to keep?'
                ].map((question, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Placeholder */}
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask me about your taxes..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button className="bg-gradient-to-r from-[#00E0FF] to-[#4B00FF]">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAGIPanel(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}