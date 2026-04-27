import React, { useState } from 'react';
import { IRSCategoryDropdown, IRS_CATEGORIES } from './IRSCategoryDropdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle2, Plus, X } from 'lucide-react';

/**
 * Comprehensive showcase of the IRS Category Dropdown component
 * Demonstrates various use cases and integration patterns
 */
export function IRSCategoryShowcase() {
  const [basicCategory, setBasicCategory] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  
  const [multipleCategories, setMultipleCategories] = useState<Array<{
    id: number;
    description: string;
    amount: number;
    category: string;
  }>>([
    { id: 1, description: 'Office supplies', amount: 150.00, category: '' },
    { id: 2, description: 'Gas for delivery', amount: 75.50, category: '' },
    { id: 3, description: 'Client lunch', amount: 45.00, category: '' },
  ]);

  const updateTransactionCategory = (id: number, category: string) => {
    setMultipleCategories(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const addTransaction = () => {
    const newId = Math.max(...multipleCategories.map(t => t.id), 0) + 1;
    setMultipleCategories([...multipleCategories, {
      id: newId,
      description: 'New expense',
      amount: 0,
      category: ''
    }]);
  };

  const removeTransaction = (id: number) => {
    setMultipleCategories(prev => prev.filter(t => t.id !== id));
  };

  const selectedBasicCategory = IRS_CATEGORIES.find(cat => cat.code === basicCategory);
  const selectedFormCategory = IRS_CATEGORIES.find(cat => cat.code === formCategory);
  const categorizedCount = multipleCategories.filter(t => t.category).length;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">IRS Category Dropdown Showcase</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Demonstrating the reusable IRS Schedule C category dropdown component
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Usage</CardTitle>
            <CardDescription>
              Simple category selection with value display
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select IRS Category</Label>
              <IRSCategoryDropdown
                value={basicCategory}
                onChange={setBasicCategory}
                placeholder="Choose a category..."
              />
            </div>

            {selectedBasicCategory && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Category Selected
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Code:</span>
                    <Badge variant="outline">{selectedBasicCategory.code}</Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{selectedBasicCategory.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Group:</span>
                    <span>{selectedBasicCategory.group}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedBasicCategory.description}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Form Integration</CardTitle>
            <CardDescription>
              Using the dropdown in a transaction form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>IRS Tax Category</Label>
              <IRSCategoryDropdown
                value={formCategory}
                onChange={setFormCategory}
                placeholder="Categorize this expense..."
              />
            </div>

            <Button 
              className="w-full"
              disabled={!formCategory || !transactionAmount}
            >
              Save Transaction
            </Button>

            {formCategory && transactionAmount && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Ready to save: ${transactionAmount} as{' '}
                  <span className="font-medium">
                    {selectedFormCategory?.name}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Categorization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Batch Categorization</CardTitle>
              <CardDescription>
                Categorize multiple transactions at once
              </CardDescription>
            </div>
            <Button onClick={addTransaction} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <Badge variant={categorizedCount === multipleCategories.length ? 'default' : 'outline'}>
                {categorizedCount} of {multipleCategories.length} categorized
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    IRS Category
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {multipleCategories.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm">
                      {transaction.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <IRSCategoryDropdown
                        value={transaction.category}
                        onChange={(cat) => updateTransactionCategory(transaction.id, cat)}
                        placeholder="Select category..."
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categorizedCount === multipleCategories.length && multipleCategories.length > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  All transactions categorized! Ready to export to IRS Schedule C.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Functionality</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ 23 IRS Schedule C expense categories</li>
                <li>✓ Built-in search functionality</li>
                <li>✓ Category grouping by type</li>
                <li>✓ Scrollable dropdown panel</li>
                <li>✓ Keyboard navigation support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Technical</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ Fully typed with TypeScript</li>
                <li>✓ Reusable across the app</li>
                <li>✓ Accessible with ARIA labels</li>
                <li>✓ Responsive design</li>
                <li>✓ Dark mode compatible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
