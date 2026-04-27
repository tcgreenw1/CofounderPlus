import React from 'react';
import { AGIActionBar } from './AGIActionBar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

/**
 * Example demonstrating how to use the AGI Action Bar above any transaction table
 * 
 * The AGI Action Bar provides 6 powerful AI-driven features:
 * 1. Auto Categorize All - Automatically categorize uncategorized transactions
 * 2. Auto Create Rules - Create categorization rules based on patterns
 * 3. Detect Duplicates - Find and merge duplicate transactions
 * 4. Match Transfers - Identify and match bank transfers
 * 5. Prepare Tax Summary - Generate comprehensive tax summary
 * 6. Explain This Month - Get AI insights about transactions
 */
export function AGIActionBarExample() {
  const handleTaskComplete = (taskType: string) => {
    console.log(`AGI Task completed: ${taskType}`);
    // Refresh your transaction data here
    // e.g., fetchTransactions();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AGI Action Bar Example</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Demonstrating the reusable AGI Action Bar for transaction tables
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Table with AGI Actions</CardTitle>
          <CardDescription>
            The AGI Action Bar sits above your transaction table, providing AI-powered tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* AGI Action Bar */}
          <AGIActionBar
            onTaskComplete={handleTaskComplete}
            businessId="your-business-id"
            month="2024-11"
          />

          {/* Your transaction table would go here */}
          <div className="mt-6 p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center text-gray-500">
            <p>Your transaction table goes here</p>
            <p className="text-sm mt-2">The AGI Action Bar automatically appears above it</p>
          </div>
        </CardContent>
      </Card>

      {/* Features Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>AGI Actions Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">⚡</span>
                Auto Categorize All
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically categorizes all uncategorized transactions using AI analysis
                of descriptions, merchants, and historical patterns.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">✨</span>
                Auto Create Rules
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Creates intelligent categorization rules based on your transaction history
                to automate future categorizations.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📋</span>
                Detect Duplicates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scans all transactions to find and merge duplicate entries based on
                amount, date, and description.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">🔄</span>
                Match Transfers
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Identifies and matches bank transfers between accounts to avoid
                double-counting in reports.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📄</span>
                Prepare Tax Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generates a comprehensive tax summary with all deductible expenses
                organized by IRS Schedule C categories.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📅</span>
                Explain This Month
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Provides AI-generated insights and explanations about this month's
                transactions, trends, and anomalies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How to Integrate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Import the Component</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`import { AGIActionBar } from './components/AGIActionBar';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Add Above Your Transaction Table</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<AGIActionBar
  onTaskComplete={(taskType) => {
    console.log('Task completed:', taskType);
    // Refresh your data here
  }}
  businessId={selectedBusiness?.id}
  month={new Date().toISOString().slice(0, 7)}
/>

{/* Your transaction table */}
<table>
  {/* ... */}
</table>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Handle Task Completion</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                The <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">onTaskComplete</code> callback
                is called when any AGI task finishes successfully. Use it to refresh your transaction data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Previews */}
      <Card>
        <CardHeader>
          <CardTitle>Task Modal Features</CardTitle>
          <CardDescription>
            Each button opens a modal with a task preview before execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Task Summary:</strong> Clear description of what will happen</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Statistics:</strong> Key metrics about the operation</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Preview of Changes:</strong> Detailed list of actions that will be performed</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Estimated Time:</strong> How long the operation will take</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Run with AGI Button:</strong> Primary action to execute the task</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p><strong>Cancel Link:</strong> Option to close without making changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
