import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Info,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
  Brain
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface CategorizationRule {
  id: string;
  rule_name: string;
  pattern: string;
  category: string;
  irs_category: string;
  applies_to: 'income' | 'expense' | 'transfer';
  auto_apply: boolean;
  created_at: string;
  business_id: string;
}

interface CategorizationRulesProps {
  user: any;
}

// Standard bookkeeping categories
const BOOKKEEPING_CATEGORIES = [
  'Advertising',
  'Bank Fees',
  'Car & Truck',
  'Commissions',
  'Contract Labor',
  'Depreciation',
  'Employee Benefits',
  'Insurance',
  'Interest',
  'Legal & Professional',
  'Meals',
  'Office Expense',
  'Rent',
  'Repairs & Maintenance',
  'Supplies',
  'Taxes & Licenses',
  'Travel',
  'Utilities',
  'Wages',
  'Other Expense',
  'Revenue',
  'Cost of Goods Sold',
  'Uncategorized'
];

// IRS Schedule C expense categories
const IRS_CATEGORIES = [
  { code: 'Line 8', name: 'Advertising', description: 'Costs of advertising and promotional materials' },
  { code: 'Line 9', name: 'Car and truck expenses', description: 'Business use of vehicle (standard mileage or actual expenses)' },
  { code: 'Line 10', name: 'Commissions and fees', description: 'Payments to non-employees for services' },
  { code: 'Line 11', name: 'Contract labor', description: 'Payments to independent contractors (Form 1099-NEC)' },
  { code: 'Line 12', name: 'Depletion', description: 'Deduction for using up natural resources' },
  { code: 'Line 13', name: 'Depreciation', description: 'Recovery of cost of business property over time' },
  { code: 'Line 14', name: 'Employee benefit programs', description: 'Accident, health insurance, and other employee benefits' },
  { code: 'Line 15', name: 'Insurance (other than health)', description: 'Business insurance premiums (not health)' },
  { code: 'Line 16a', name: 'Mortgage interest', description: 'Interest on business property mortgages' },
  { code: 'Line 16b', name: 'Other interest', description: 'Business loan and credit card interest' },
  { code: 'Line 17', name: 'Legal and professional services', description: 'Attorney, accountant, and consultant fees' },
  { code: 'Line 18', name: 'Office expense', description: 'Office supplies, postage, and stationery' },
  { code: 'Line 19', name: 'Pension and profit-sharing', description: 'Contributions to employee retirement plans' },
  { code: 'Line 20a', name: 'Rent - Vehicles/machinery/equipment', description: 'Rental costs for business equipment' },
  { code: 'Line 20b', name: 'Rent - Other business property', description: 'Office space and other property rent' },
  { code: 'Line 21', name: 'Repairs and maintenance', description: 'Costs to keep property in working condition' },
  { code: 'Line 22', name: 'Supplies', description: 'Items used and consumed in business operations' },
  { code: 'Line 23', name: 'Taxes and licenses', description: 'Business taxes, licenses, and regulatory fees' },
  { code: 'Line 24a', name: 'Travel', description: 'Airfare, lodging for overnight business trips' },
  { code: 'Line 24b', name: 'Meals', description: 'Business meals (generally 50% deductible)' },
  { code: 'Line 25', name: 'Utilities', description: 'Business phone, internet, electricity, water, gas' },
  { code: 'Line 26', name: 'Wages', description: 'Salaries and wages paid to employees' },
  { code: 'Line 27a', name: 'Other expenses', description: 'Business expenses not listed elsewhere' },
  { code: 'Line 30', name: 'Home office deduction', description: 'Deduction for business use of home (Form 8829)' },
  { code: 'Part III', name: 'Cost of Goods Sold', description: 'Direct costs of producing goods sold' },
  { code: 'Part I', name: 'Gross receipts or sales', description: 'Total business income from sales' }
];

export function CategorizationRules({ user }: CategorizationRulesProps) {
  const { selectedBusiness } = useBusiness();
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showIRSCategories, setShowIRSCategories] = useState(false);
  const [showGeneratingAGI, setShowGeneratingAGI] = useState(false);
  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    pattern: '',
    category: '',
    irs_category: '',
    applies_to: 'expense' as 'income' | 'expense' | 'transfer',
    auto_apply: true
  });

  useEffect(() => {
    if (selectedBusiness) {
      loadRules();
    }
  }, [selectedBusiness]);

  const loadRules = async () => {
    if (!selectedBusiness) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/rules?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
      toast.error('Failed to load categorization rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    if (!formData.rule_name || !formData.pattern || !formData.category || !formData.irs_category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const payload = {
        ...formData,
        businessId: selectedBusiness.id,
        ruleId: editingRule?.id
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/rules`,
        {
          method: editingRule ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        toast.success(editingRule ? 'Rule updated successfully' : 'Rule created successfully');
        setShowAddRule(false);
        setEditingRule(null);
        resetForm();
        loadRules();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast.error('An error occurred while saving the rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/rules/${ruleId}?businessId=${selectedBusiness?.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        toast.success('Rule deleted successfully');
        loadRules();
      } else {
        toast.error('Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast.error('An error occurred while deleting the rule');
    }
  };

  const handleEditRule = (rule: CategorizationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      pattern: rule.pattern,
      category: rule.category,
      irs_category: rule.irs_category,
      applies_to: rule.applies_to,
      auto_apply: rule.auto_apply
    });
    setShowAddRule(true);
  };

  const handleToggleAutoApply = async (rule: CategorizationRule) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/rules/${rule.id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            auto_apply: !rule.auto_apply
          })
        }
      );

      if (response.ok) {
        loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle auto-apply:', error);
    }
  };

  const handleGenerateAGIRules = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setShowGeneratingAGI(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/generate-smart-rules`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            userId: user.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Generated ${data.rulesCreated || 0} smart rules!`);
        loadRules();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate rules');
      }
    } catch (error) {
      console.error('Failed to generate AGI rules:', error);
      toast.error('An error occurred while generating smart rules');
    } finally {
      setShowGeneratingAGI(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      pattern: '',
      category: '',
      irs_category: '',
      applies_to: 'expense',
      auto_apply: true
    });
  };

  const getAppliesToBadgeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expense':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Main Content - Rules Table */}
      <div className="lg:col-span-3 space-y-4">
        {/* Header with AGI Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Categorization Rules</h2>
            <p className="text-sm text-gray-500 mt-1">
              Define patterns to automatically categorize transactions
            </p>
          </div>
          <Button
            onClick={handleGenerateAGIRules}
            disabled={showGeneratingAGI}
            className="bg-gradient-to-r from-[#00E0FF] to-[#4B00FF] hover:opacity-90"
          >
            {showGeneratingAGI ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Let AGI Create Smart Rules
              </>
            )}
          </Button>
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Active Rules ({rules.length})</CardTitle>
              <Button onClick={() => { resetForm(); setEditingRule(null); setShowAddRule(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Rule Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Pattern
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      IRS Category
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Applies To
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Auto-Apply
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Loading rules...
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-2">No categorization rules yet</p>
                        <p className="text-sm text-gray-400">
                          Add a rule or let AGI create smart rules for you
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4 font-medium">{rule.rule_name}</td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {rule.pattern}
                        </td>
                        <td className="py-3 px-4 text-sm">{rule.category}</td>
                        <td className="py-3 px-4 text-sm">{rule.irs_category}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={getAppliesToBadgeColor(rule.applies_to)}>
                            {rule.applies_to}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch
                            checked={rule.auto_apply}
                            onCheckedChange={() => handleToggleAutoApply(rule)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Show All IRS Categories Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowIRSCategories(true)}
            className="w-full sm:w-auto"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Show All IRS Categories
          </Button>
        </div>
      </div>

      {/* Sidebar - Explanation Card */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-5 h-5 text-[#00E0FF]" />
              How Rules Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Pattern Matching
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Rules match transaction descriptions, vendors, or amounts. Use keywords like "Amazon", "Uber", or specific dollar amounts.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Auto-Apply
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                When enabled, rules automatically categorize new transactions that match the pattern. Disable for manual review.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AGI Learning
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Our AGI learns from your past transactions and creates intelligent rules based on patterns it discovers. The more you use it, the smarter it gets.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                IRS Compliance
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                IRS category mappings ensure your transactions are properly classified for Schedule C tax reporting.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 italic">
                💡 Tip: Start with a few manual rules, then let AGI analyze your transaction history to create smart rules automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Categorization Rule' : 'Create Categorization Rule'}
            </DialogTitle>
            <DialogDescription>
              Define a pattern to automatically categorize transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rule_name">Rule Name *</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="e.g., Amazon Purchases"
              />
            </div>

            <div>
              <Label htmlFor="pattern">Pattern *</Label>
              <Input
                id="pattern"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                placeholder="e.g., Amazon, AMZN, or amount:50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Matches transaction description, vendor name, or amount (use "amount:50" for exact amounts)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKKEEPING_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="applies_to">Applies To *</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value: any) => setFormData({ ...formData, applies_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="irs_category">IRS Category Mapping *</Label>
              <Select
                value={formData.irs_category}
                onValueChange={(value) => setFormData({ ...formData, irs_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select IRS category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {IRS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.code} value={cat.name}>
                      {cat.code} - {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_apply"
                checked={formData.auto_apply}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
              />
              <Label htmlFor="auto_apply" className="cursor-pointer">
                Auto-apply this rule to new transactions
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddRule(false); setEditingRule(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IRS Categories Modal */}
      <Dialog open={showIRSCategories} onOpenChange={setShowIRSCategories}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>IRS Schedule C Expense Categories</DialogTitle>
            <DialogDescription>
              Standard business tax categories for proper expense classification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {IRS_CATEGORIES.map((cat) => (
              <Card key={cat.code}>
                <CardHeader className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {cat.code}: {cat.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {cat.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {cat.code}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowIRSCategories(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AGI Generation Modal */}
      <Dialog open={showGeneratingAGI} onOpenChange={setShowGeneratingAGI}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00E0FF] animate-pulse" />
              Generating Smart Rules
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-[#4B00FF] animate-pulse" />
            <p className="text-sm text-gray-600">
              AGI is analyzing your transaction history and creating intelligent categorization rules...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}