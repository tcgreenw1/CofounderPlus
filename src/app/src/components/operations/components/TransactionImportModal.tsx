import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseTransactionFile, generateSampleCSV, ParsedTransaction, ParseResult } from '../utils/csvParser';
import { toast } from 'sonner';

interface TransactionImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: ParsedTransaction[]) => Promise<void>;
}

export function TransactionImportModal({ open, onClose, onImport }: TransactionImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseResult(null);

    try {
      const result = await parseTransactionFile(selectedFile);
      setParseResult(result);
    } catch (error) {
      toast.error('Failed to parse file');
      console.error('File parse error:', error);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded!');
  };

  const handleImport = async () => {
    if (!parseResult?.data || parseResult.data.length === 0) {
      toast.error('No valid transactions to import');
      return;
    }

    setImporting(true);
    try {
      await onImport(parseResult.data);
      toast.success(`Successfully imported ${parseResult.data.length} transaction(s)`);
      handleClose();
    } catch (error) {
      toast.error('Failed to import transactions');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file to bulk import your transactions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="format">File Format</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="transaction-file-input"
              />
              <label htmlFor="transaction-file-input" className="cursor-pointer">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">
                  {file ? (
                    <span className="text-green-600">{file.name}</span>
                  ) : (
                    <>Click to upload or drag and drop</>
                  )}
                </p>
                <p className="text-sm text-gray-500">CSV or XLSX files only</p>
              </label>
            </div>

            {/* Parse Results */}
            {parseResult && (
              <div className="space-y-4">
                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Errors found:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {parseResult.errors.map((error, idx) => (
                          <li key={idx} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Warnings */}
                {parseResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Warnings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {parseResult.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success */}
                {parseResult.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Successfully parsed {parseResult.data.length} transaction(s)
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview Table */}
                {parseResult.data.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-semibold">Preview ({parseResult.data.length} transactions)</h3>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.data.slice(0, 50).map((transaction, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">{transaction.date}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                  transaction.type === 'income' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 capitalize">{transaction.category}</td>
                              <td className="px-4 py-2 text-right">${transaction.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 truncate max-w-xs">{transaction.description}</td>
                              <td className="px-4 py-2 capitalize">{transaction.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parseResult.data.length > 50 && (
                        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                          Showing first 50 of {parseResult.data.length} transactions
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {parseResult.success && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleClose} disabled={importing}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={importing}>
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import {parseResult.data.length} Transaction(s)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="format" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Required Columns</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li><strong>date</strong> - Transaction date (YYYY-MM-DD or MM/DD/YYYY format)</li>
                  <li><strong>type</strong> - Either "income" or "expense"</li>
                  <li><strong>amount</strong> - Transaction amount (positive number)</li>
                  <li><strong>description</strong> - Transaction description or memo</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Optional Columns</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li><strong>category</strong> - Transaction category (defaults to "other")</li>
                  <li><strong>status</strong> - Transaction status (defaults to "completed")</li>
                  <li><strong>recurrence_type</strong> - one-time, bi-weekly, monthly, or annual</li>
                  <li><strong>scheduled_date</strong> - For future transactions</li>
                  <li><strong>next_occurrence</strong> - Next date for recurring transactions</li>
                  <li><strong>recurrence_end_date</strong> - End date for recurring transactions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Supported Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'consulting', 'investment', 'other', 'salary', 'marketing', 'operations', 
                    'utilities', 'rent', 'supplies', 'software', 'travel', 'meals'].map(cat => (
                    <span key={cat} className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Example CSV Format</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
{`date,type,category,amount,description,status,recurrence_type
2024-01-15,income,sales,1500.00,Product sales revenue,completed,one-time
2024-01-16,expense,marketing,250.00,Facebook ads,completed,one-time
2024-02-01,expense,rent,2000.00,Office rent,completed,monthly`}
                </pre>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleDownloadSample} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
