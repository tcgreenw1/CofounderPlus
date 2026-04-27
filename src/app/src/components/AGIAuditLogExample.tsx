import React from 'react';
import { AGIAuditLog } from './AGIAuditLog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

/**
 * Example demonstrating how to use the AGI Audit Log component
 * 
 * The AGI Audit Log is a comprehensive, reusable table component that displays:
 * - Timestamp (with relative time)
 * - Action (with dynamic icons)
 * - Summary (description of what was done)
 * - Records Affected (count)
 * - Status (Success, Failed, In Progress)
 * 
 * Features:
 * - Search functionality (searches action and summary)
 * - Status filter dropdown
 * - Pagination (customizable page size)
 * - Responsive design
 * - Summary statistics footer
 * - Refresh functionality
 * - Loading states
 * - Empty states
 */
export function AGIAuditLogExample() {
  const handleRefresh = () => {
    console.log('Audit log refreshed!');
    // Trigger any necessary data refreshes
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AGI Audit Log Component</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          A comprehensive audit log table for tracking all AGI-powered actions
        </p>
      </div>

      {/* Demo - Full Featured */}
      <AGIAuditLog
        businessId="demo-business-id"
        title="AGI Audit Log"
        description="Track all AI-powered actions and automations"
        showHeader={true}
        maxHeight="600px"
        pageSize={10}
        onRefresh={handleRefresh}
      />

      {/* Demo - Compact Version */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Version (No Header)</CardTitle>
          <CardDescription>
            You can hide the header and adjust height for embedded use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AGIAuditLog
            businessId="demo-business-id"
            showHeader={false}
            maxHeight="300px"
            pageSize={5}
          />
        </CardContent>
      </Card>

      {/* Features Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-purple-600">🔍</span>
                Search Functionality
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Real-time search across Action and Summary fields with instant results
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-blue-600">🎯</span>
                Status Filtering
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Filter by Success, Failed, In Progress, or view All
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-green-600">📄</span>
                Pagination
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Smart pagination with configurable page size and visual page numbers
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-orange-600">⏱️</span>
                Relative Timestamps
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                User-friendly relative time ("5m ago", "2h ago") with full timestamp on hover
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-red-600">✨</span>
                Dynamic Icons
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Action-specific icons (categorize, export, tax, etc.) with purple background
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-yellow-600">📊</span>
                Summary Statistics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Footer showing total successful, failed, in-progress, and total records affected
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-pink-600">🔄</span>
                Refresh Button
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Manual refresh with loading state and callback support
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <span className="text-indigo-600">📱</span>
                Responsive Design
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                Scrollable on mobile, fully responsive table with sticky header
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
{`import { AGIAuditLog } from './components/AGIAuditLog';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Basic Usage</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<AGIAuditLog
  businessId={selectedBusiness?.id}
  title="AGI Activity Log"
  description="Track all automated actions"
  showHeader={true}
  maxHeight="500px"
  pageSize={10}
  onRefresh={() => console.log('Refreshed!')}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Embedded Usage (No Header)</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`<AGIAuditLog
  businessId={businessId}
  showHeader={false}
  maxHeight="300px"
  pageSize={5}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Props</h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">businessId</code>
                  <span className="text-gray-600">- Business ID for loading audit logs (optional)</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">title</code>
                  <span className="text-gray-600">- Card title (default: "AGI Audit Log")</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">description</code>
                  <span className="text-gray-600">- Card description</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">showHeader</code>
                  <span className="text-gray-600">- Show/hide card header (default: true)</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">maxHeight</code>
                  <span className="text-gray-600">- Maximum height with scroll (default: "600px")</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">pageSize</code>
                  <span className="text-gray-600">- Items per page (default: 10)</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">onRefresh</code>
                  <span className="text-gray-600">- Callback when refresh button clicked</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Columns */}
      <Card>
        <CardHeader>
          <CardTitle>Table Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Column</th>
                  <th className="text-left py-2 px-4 font-medium">Description</th>
                  <th className="text-left py-2 px-4 font-medium">Format</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4 font-medium">Timestamp</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    When the action occurred
                  </td>
                  <td className="py-2 px-4 text-sm">
                    Relative ("5m ago") + time
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-medium">Action</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    Type of AGI action performed
                  </td>
                  <td className="py-2 px-4 text-sm">
                    Text with icon
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-medium">Summary</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    Description of what was done
                  </td>
                  <td className="py-2 px-4 text-sm">
                    Text (max 2 lines)
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-medium">Records Affected</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    Number of records modified
                  </td>
                  <td className="py-2 px-4 text-sm">
                    Badge with number
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-medium">Status</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    Success, Failed, or In Progress
                  </td>
                  <td className="py-2 px-4 text-sm">
                    Color-coded badge
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status Types */}
      <Card>
        <CardHeader>
          <CardTitle>Status Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
              <div className="font-medium text-green-700">Success</div>
              <div className="text-sm text-green-600">
                Action completed successfully - shown with green badge and checkmark icon
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="font-medium text-red-700">Failed</div>
              <div className="text-sm text-red-600">
                Action encountered an error - shown with red badge and X icon
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-700">In Progress</div>
              <div className="text-sm text-blue-600">
                Action currently running - shown with blue badge and spinning clock icon
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
  "logs": [
    {
      "id": "unique-id",
      "timestamp": "2024-03-15T10:30:00Z",
      "action": "Auto Categorize All",
      "summary": "Automatically categorized 47 uncategorized transactions",
      "recordsAffected": 47,
      "status": "success" // "success" | "failed" | "in_progress"
    },
    // ... more logs
  ]
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Current Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Auto-Bookkeeping Engine - Overview Tab</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Title: "Recent AGI Activity" • Page Size: 10 • Max Height: 500px
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium">Auto-Bookkeeping Engine - Exports Center Tab</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Title: "Export Activity Log" • Page Size: 8 • Max Height: 400px
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mock Data Info */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The component includes 15 sample audit log entries for demonstration:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
            <li>Auto Categorize All (multiple entries)</li>
            <li>Create Categorization Rule (multiple entries)</li>
            <li>Detect Duplicates</li>
            <li>Match Transfers</li>
            <li>Prepare Tax Summary</li>
            <li>Export Transaction Data</li>
            <li>Recalculate Quarterly Taxes</li>
            <li>Generate Tax Package</li>
            <li>Export Profit & Loss</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Mock data includes various statuses, realistic timestamps, and record counts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
