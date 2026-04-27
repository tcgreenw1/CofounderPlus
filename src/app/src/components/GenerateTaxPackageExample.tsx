import React, { useState } from 'react';
import { GenerateTaxPackageModal } from './GenerateTaxPackageModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Package, Sparkles } from 'lucide-react';

/**
 * Example demonstrating how to use the Generate Tax Package Modal
 * 
 * This modal allows users to:
 * - Select a tax year (current year + past 5 years)
 * - Choose export format (PDF, CSV, or Both)
 * - Select which reports to include via toggle switches
 * - Generate a comprehensive tax package with AGI
 */
export function GenerateTaxPackageExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleComplete = () => {
    console.log('Tax package generation completed!');
    // Refresh your data or show confirmation here
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Tax Package Modal</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          A comprehensive modal for generating tax packages with multiple report types
        </p>
      </div>

      {/* Demo Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Package Generator</CardTitle>
          <CardDescription>
            Click the button below to open the modal and configure your tax package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Package className="w-4 h-4 mr-2" />
            Generate Tax Package
          </Button>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📅</span>
                Year Selector
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Dropdown to select tax year (current year and past 5 years available)
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📄</span>
                Format Selector
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Choose between PDF, CSV, or Both formats for your reports
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📋</span>
                Report Toggle List
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Select which reports to include in your package:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 pl-12 space-y-1">
                <li>• Schedule C - IRS Schedule C form</li>
                <li>• Profit & Loss - Income statement</li>
                <li>• Balance Sheet - Assets, liabilities, and equity</li>
                <li>• Full Ledger - Complete general ledger</li>
                <li>• Transaction CSV - All transactions export</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">✨</span>
                AGI Integration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Powered by AGI for intelligent report generation and formatting
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
              <h4 className="font-medium mb-2">1. Import the Modal</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`import { GenerateTaxPackageModal } from './components/GenerateTaxPackageModal';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Add State and Handler</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`const [isModalOpen, setIsModalOpen] = useState(false);

const handleComplete = () => {
  console.log('Tax package generated!');
  // Refresh data or show confirmation
};`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Add the Modal Component</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<GenerateTaxPackageModal
  open={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  businessId={selectedBusiness?.id}
  onComplete={handleComplete}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Trigger from a Button</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<Button onClick={() => setIsModalOpen(true)}>
  <Package className="w-4 h-4 mr-2" />
  Generate Tax Package
</Button>`}
              </pre>
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
                <p className="font-medium">Tax Filing Season</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate all necessary reports for tax filing (Schedule C, P&L, etc.)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Accountant Sharing</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Package all financial documents to share with your accountant
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Year-End Review</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Create comprehensive year-end financial package for review
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Audit Preparation</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate complete ledger and transaction records for audit purposes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Investor Reports</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Create professional financial reports for investors
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Selections */}
      <Card>
        <CardHeader>
          <CardTitle>Default Selections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Year:</span>
              <span className="font-medium">{new Date().getFullYear()} (Current Year)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Format:</span>
              <span className="font-medium">PDF</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500">Reports:</span>
              <div>
                <p className="font-medium">Schedule C, Profit & Loss, Balance Sheet</p>
                <p className="text-xs text-gray-500 mt-1">
                  (Full Ledger and Transaction CSV are off by default)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Modal */}
      <GenerateTaxPackageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId="demo-business-id"
        onComplete={handleComplete}
      />
    </div>
  );
}
