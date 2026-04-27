import React from 'react';
import { EstimatedQuarterlyTaxesCard } from './EstimatedQuarterlyTaxesCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

/**
 * Example demonstrating how to use the Estimated Quarterly Taxes Card
 * 
 * This card displays:
 * - Federal quarterly tax estimate
 * - State quarterly tax estimate
 * - Safe Harbor status (Met, At Risk, Not Met)
 * - Next payment deadline
 * - Recalculate with AGI button
 */
export function EstimatedQuarterlyTaxesExample() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const handleRecalculate = () => {
    console.log('Tax estimates recalculated!');
    // Refresh related data here
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estimated Quarterly Taxes Card</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          A comprehensive card component for displaying quarterly tax estimates
        </p>
      </div>

      {/* Demo Cards - Multiple Quarters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EstimatedQuarterlyTaxesCard
          businessId="demo-business-1"
          year={currentYear}
          quarter={1}
          onRecalculate={handleRecalculate}
        />
        <EstimatedQuarterlyTaxesCard
          businessId="demo-business-1"
          year={currentYear}
          quarter={2}
          onRecalculate={handleRecalculate}
        />
        <EstimatedQuarterlyTaxesCard
          businessId="demo-business-1"
          year={currentYear}
          quarter={3}
          onRecalculate={handleRecalculate}
        />
        <EstimatedQuarterlyTaxesCard
          businessId="demo-business-1"
          year={currentYear}
          quarter={4}
          onRecalculate={handleRecalculate}
        />
      </div>

      {/* Features Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Card Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">💰</span>
                Total Estimated Payment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Prominent display of combined federal and state estimates in a purple/blue gradient box
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-blue-600">🛡️</span>
                Federal Estimate
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                IRS quarterly payment estimate with shield icon and description
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-green-600">🛡️</span>
                State Estimate
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                State quarterly payment estimate with shield icon and description
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-yellow-600">✅</span>
                Safe Harbor Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Color-coded badge showing penalty protection status:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 pl-12 space-y-1">
                <li>• <span className="text-green-600 font-medium">Met</span> - Safe from penalties (green)</li>
                <li>• <span className="text-yellow-600 font-medium">At Risk</span> - May face penalties (yellow)</li>
                <li>• <span className="text-red-600 font-medium">Not Met</span> - Penalty risk (red)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-orange-600">📅</span>
                Next Payment Deadline
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                IRS due date for the current quarter (formatted as "Month Day, Year")
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">✨</span>
                Recalculate with AGI Button
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Full-width gradient button to trigger AGI-powered recalculation with loading state
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
{`import { EstimatedQuarterlyTaxesCard } from './components/EstimatedQuarterlyTaxesCard';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Add to Your Page</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<EstimatedQuarterlyTaxesCard
  businessId={selectedBusiness?.id}
  year={2024}
  quarter={1}
  onRecalculate={() => {
    console.log('Recalculated!');
    // Refresh your data
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Display Multiple Quarters (Grid Layout)</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {[1, 2, 3, 4].map(quarter => (
    <EstimatedQuarterlyTaxesCard
      key={quarter}
      businessId={businessId}
      year={2024}
      quarter={quarter}
      onRecalculate={handleRecalculate}
    />
  ))}
</div>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Props</h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">businessId</code>
                  <span className="text-gray-600">- Business ID for loading tax data</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">year</code>
                  <span className="text-gray-600">- Tax year (defaults to current year)</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">quarter</code>
                  <span className="text-gray-600">- Quarter number 1-4 (defaults to current)</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">onRecalculate</code>
                  <span className="text-gray-600">- Callback when recalculation completes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Deadlines Reference */}
      <Card>
        <CardHeader>
          <CardTitle>IRS Quarterly Deadlines</CardTitle>
          <CardDescription>Standard due dates for estimated tax payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Q1 {currentYear}</span>
                <span className="text-sm text-gray-500">Jan 1 - Mar 31</span>
              </div>
              <p className="text-sm text-gray-600">
                Deadline: <span className="font-semibold">April 15, {currentYear}</span>
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Q2 {currentYear}</span>
                <span className="text-sm text-gray-500">Apr 1 - May 31</span>
              </div>
              <p className="text-sm text-gray-600">
                Deadline: <span className="font-semibold">June 15, {currentYear}</span>
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Q3 {currentYear}</span>
                <span className="text-sm text-gray-500">Jun 1 - Aug 31</span>
              </div>
              <p className="text-sm text-gray-600">
                Deadline: <span className="font-semibold">September 15, {currentYear}</span>
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Q4 {currentYear}</span>
                <span className="text-sm text-gray-500">Sep 1 - Dec 31</span>
              </div>
              <p className="text-sm text-gray-600">
                Deadline: <span className="font-semibold">January 15, {currentYear + 1}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Finance Dashboard</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Display current quarter estimates on main finance dashboard
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Tax Planning Page</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Show all 4 quarters in a grid for annual tax planning
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Auto-Bookkeeping Engine</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Include in Tax Prep tab for comprehensive tax preparation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Quarterly Reminders</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Show upcoming deadline with estimate when payment is due
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Data Structure</CardTitle>
          <CardDescription>Expected API response format</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "federalEstimate": 3250,
  "stateEstimate": 975,
  "safeHarborStatus": "met", // "met" | "at-risk" | "not-met" | "unknown"
  "nextDeadline": "2024-04-15",
  "lastCalculated": "2024-03-01T10:30:00Z"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
