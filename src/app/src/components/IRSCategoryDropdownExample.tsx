import React, { useState } from 'react';
import { IRSCategoryDropdown } from './IRSCategoryDropdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

/**
 * Example usage of the IRSCategoryDropdown component
 * This demonstrates how to use the reusable IRS Category Dropdown across the app
 */
export function IRSCategoryDropdownExample() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>IRS Category Dropdown Example</CardTitle>
        <CardDescription>
          Select an IRS Schedule C category from the dropdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">IRS Category</label>
          <IRSCategoryDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Choose an IRS category..."
          />
        </div>

        {selectedCategory && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected Category: <span className="font-mono">{selectedCategory}</span>
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Search functionality to quickly find categories</li>
            <li>Grouped by category type (Operating Expenses, Vehicle & Travel, etc.)</li>
            <li>Scrollable panel for easy browsing</li>
            <li>23 IRS Schedule C expense categories</li>
            <li>Shows category code, name, and description</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
