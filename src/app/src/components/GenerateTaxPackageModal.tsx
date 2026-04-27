import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { 
  Sparkles, 
  Loader2, 
  FileText,
  FileSpreadsheet,
  Package,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface GenerateTaxPackageModalProps {
  open: boolean;
  onClose: () => void;
  businessId?: string;
  onComplete?: () => void;
}

interface ReportToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: any;
}

type FormatType = 'pdf' | 'csv' | 'both';

export function GenerateTaxPackageModal({
  open,
  onClose,
  businessId,
  onComplete
}: GenerateTaxPackageModalProps) {
  const currentYear = new Date().getFullYear();
  
  // State
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Report toggles
  const [reports, setReports] = useState<ReportToggle[]>([
    {
      id: 'schedule-c',
      label: 'Schedule C',
      description: 'IRS Schedule C form with business income and expenses',
      enabled: true,
      icon: FileText
    },
    {
      id: 'profit-loss',
      label: 'Profit & Loss',
      description: 'Income statement showing revenue and expenses',
      enabled: true,
      icon: FileSpreadsheet
    },
    {
      id: 'balance-sheet',
      label: 'Balance Sheet',
      description: 'Assets, liabilities, and equity summary',
      enabled: true,
      icon: FileSpreadsheet
    },
    {
      id: 'full-ledger',
      label: 'Full Ledger',
      description: 'Complete general ledger with all transactions',
      enabled: false,
      icon: FileText
    },
    {
      id: 'transaction-csv',
      label: 'Transaction CSV',
      description: 'All transactions exported to CSV format',
      enabled: false,
      icon: FileSpreadsheet
    }
  ]);

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Toggle report
  const toggleReport = (reportId: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? { ...report, enabled: !report.enabled }
          : report
      )
    );
  };

  // Get enabled reports count
  const enabledReportsCount = reports.filter(r => r.enabled).length;

  // Handle generate
  const handleGenerate = async () => {
    if (enabledReportsCount === 0) {
      toast.error('Please select at least one report to generate');
      return;
    }

    if (!businessId) {
      toast.error('Please select a business first');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsGenerating(false);
        return;
      }

      const enabledReportIds = reports
        .filter(r => r.enabled)
        .map(r => r.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/tax-package/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            year: parseInt(selectedYear),
            format: selectedFormat,
            reports: enabledReportIds
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // If response includes download URL
        if (data.downloadUrl) {
          // Download the file
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = `tax-package-${selectedYear}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        toast.success(`Tax package for ${selectedYear} generated successfully!`);
        onComplete?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate tax package');
      }
    } catch (error) {
      console.error('Error generating tax package:', error);
      toast.error('An error occurred while generating the tax package');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                Generate Tax Package
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AGI
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Create a comprehensive tax package with all necessary reports and documents
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Configuration Sections */}
        <div className="space-y-6 py-4">
          {/* Year Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              Tax Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select tax year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === currentYear && '(Current Year)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the tax year for which you want to generate reports
            </p>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              Export Format
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setSelectedFormat('pdf')}
                className="w-full justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant={selectedFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setSelectedFormat('csv')}
                className="w-full justify-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={selectedFormat === 'both' ? 'default' : 'outline'}
                onClick={() => setSelectedFormat('both')}
                className="w-full justify-center"
              >
                <Package className="w-4 h-4 mr-2" />
                Both
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Choose the file format for your reports
            </p>
          </div>

          {/* Report Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Reports to Include</Label>
              <Badge variant="outline" className="text-xs">
                {enabledReportsCount} selected
              </Badge>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => {
                const IconComponent = report.icon;
                return (
                  <div
                    key={report.id}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      report.enabled
                        ? 'bg-purple-100 dark:bg-purple-900/40'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${
                        report.enabled
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{report.label}</h4>
                        {report.enabled && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                    </div>

                    <Switch
                      checked={report.enabled}
                      onCheckedChange={() => toggleReport(report.id)}
                      aria-label={`Toggle ${report.label}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Info */}
          {enabledReportsCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    Package Summary
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Generating {enabledReportsCount} report{enabledReportsCount !== 1 ? 's' : ''} for tax year {selectedYear} in{' '}
                    {selectedFormat === 'both' ? 'PDF and CSV' : selectedFormat.toUpperCase()} format
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    All reports will be packaged into a single ZIP file for easy download
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="link"
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || enabledReportsCount === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AGI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
