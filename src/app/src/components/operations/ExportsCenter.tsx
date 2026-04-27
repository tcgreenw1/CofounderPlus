import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Calendar,
  User,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  BookOpen,
  Calculator,
  Scale,
  Package
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { GenerateTaxPackageModal } from '../GenerateTaxPackageModal';
import { AGIAuditLog } from '../AGIAuditLog';

interface ExportsCenterProps {
  user: any;
}

interface ExportLog {
  id: string;
  export_name: string;
  date_generated: string;
  format: string;
  performed_by: string;
  status: 'success' | 'failed';
}

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  formats: string[];
  endpoint: string;
}

export function ExportsCenter({ user }: ExportsCenterProps) {
  const { selectedBusiness } = useBusiness();
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [loadingExports, setLoadingExports] = useState<{ [key: string]: boolean }>({});
  const [generatingWithAGI, setGeneratingWithAGI] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTaxPackageModalOpen, setIsTaxPackageModalOpen] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      id: 'schedule-c',
      title: 'IRS Schedule C Export',
      description: 'Complete Schedule C form with all business income and expenses categorized by IRS requirements',
      icon: FileText,
      formats: ['TXT'], // Plain text format (PDF generation requires pdfkit library)
      endpoint: 'schedule-c'
    },
    {
      id: 'full-ledger',
      title: 'Full Ledger Export',
      description: 'Complete general ledger with all transactions, debits, credits, and running balances',
      icon: BookOpen,
      formats: ['CSV'],
      endpoint: 'full-ledger'
    },
    {
      id: 'categorized-transactions',
      title: 'Categorized Transactions',
      description: 'All transactions organized by category with subtotals and tax classification',
      icon: FileSpreadsheet,
      formats: ['CSV'],
      endpoint: 'categorized-transactions'
    },
    {
      id: 'reconciliation',
      title: 'Reconciliation Report',
      description: 'Bank statement reconciliation showing matched and unmatched transactions with discrepancies',
      icon: CheckCircle2,
      formats: ['TXT'], // Plain text format (PDF generation requires pdfkit library)
      endpoint: 'reconciliation'
    },
    {
      id: 'quarterly-estimates',
      title: 'Quarterly Tax Estimates',
      description: 'Estimated quarterly tax payments for federal and state with payment vouchers',
      icon: Calculator,
      formats: ['TXT'], // Plain text format (PDF generation requires pdfkit library)
      endpoint: 'quarterly-estimates'
    },
    {
      id: 'financial-bundle',
      title: 'P&L and Balance Sheet Bundle',
      description: 'Complete financial statements package including profit & loss, balance sheet, and cash flow',
      icon: Package,
      formats: ['CSV'], // CSV format (XLSX generation requires xlsx library)
      endpoint: 'financial-bundle'
    }
  ];

  useEffect(() => {
    if (selectedBusiness) {
      loadExportLogs();
    }
  }, [selectedBusiness]);

  const loadExportLogs = async () => {
    if (!selectedBusiness) return;

    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/export-logs?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.logs) {
            setExportLogs(data.logs);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load export logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (option: ExportOption, useAGI: boolean = false) => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    const loadingKey = `${option.id}-${useAGI ? 'agi' : 'normal'}`;
    
    if (useAGI) {
      setGeneratingWithAGI({ ...generatingWithAGI, [option.id]: true });
    } else {
      setLoadingExports({ ...loadingExports, [option.id]: true });
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      console.log(`📊 Exporting ${option.title} (AGI: ${useAGI})...`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/export/${option.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            useAGI,
            year: new Date().getFullYear()
          })
        }
      );

      console.log(`📊 Export response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        // Try to parse error message
        try {
          const errorData = await response.json();
          console.log(`ℹ️ Export request failed (${response.status}):`, errorData);
          toast.error(errorData.error || `Failed to export ${option.title}`);
        } catch {
          console.log(`ℹ️ Export failed with status: ${response.status}`);
          toast.error(`Failed to export ${option.title} (${response.status})`);
        }
        return;
      }

      // Check if it's a blob response (file download) or JSON error
      const contentType = response.headers.get('content-type');
      console.log(`📊 Response content-type: ${contentType}`);
      
      // Accept any non-JSON response as a file download
      if (contentType && !contentType.includes('application/json')) {
        // It's a file - proceed with download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `${option.endpoint}_${selectedBusiness.id}_${new Date().toISOString().split('T')[0]}`;
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        } else {
          // Determine file extension from option formats
          const extension = option.formats.includes('PDF') ? 'pdf' : 
                           option.formats.includes('XLSX') ? 'xlsx' : 'csv';
          fileName = `${fileName}.${extension}`;
        }
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`✅ Downloaded: ${fileName}`);
        toast.success(`${option.title} downloaded successfully!`);
        
        // Reload logs to show the new export
        await loadExportLogs();
      } else {
        // It's a JSON response - likely an error
        const data = await response.json();
        console.error('❌ Export returned JSON (error):', data);
        toast.error(data.error || `Failed to export ${option.title}`);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`An error occurred during export: ${error.message || 'Unknown error'}`);
    } finally {
      if (useAGI) {
        setGeneratingWithAGI({ ...generatingWithAGI, [option.id]: false });
      } else {
        setLoadingExports({ ...loadingExports, [option.id]: false });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Exports Center</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Download your financial data in various formats
          </p>
        </div>
        <Button
          onClick={() => setIsTaxPackageModalOpen(true)}
          style={{
            background: 'linear-gradient(to right, var(--color-accent), var(--color-primary))',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <Package className="w-4 h-4 mr-2" />
          Generate Tax Package
        </Button>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportOptions.map((option) => {
          const IconComponent = option.icon;
          const isLoading = loadingExports[option.id];
          const isGenerating = generatingWithAGI[option.id];
          
          return (
            <Card key={option.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: 'var(--color-primary-soft)',
                      }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: 'var(--color-primary)' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{option.title}</CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Format Badges */}
                <div className="flex gap-2">
                  {option.formats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleExport(option, false)}
                    disabled={isLoading || isGenerating}
                    className="w-full"
                    style={{
                      background: isLoading || isGenerating ? 'var(--color-muted)' : 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => handleExport(option, true)}
                    disabled={isLoading || isGenerating}
                    className="w-full"
                    style={{
                      color: isLoading || isGenerating ? 'var(--color-muted-foreground)' : 'var(--color-accent)',
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating with AGI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AGI
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AGI Audit Log */}
      <AGIAuditLog
        businessId={selectedBusiness?.id}
        title="Export Activity Log"
        description="Track all export operations and AGI-generated reports"
        showHeader={true}
        maxHeight="400px"
        pageSize={8}
        onRefresh={loadExportLogs}
      />

      {/* Generate Tax Package Modal */}
      <GenerateTaxPackageModal
        open={isTaxPackageModalOpen}
        onClose={() => setIsTaxPackageModalOpen(false)}
        businessId={selectedBusiness?.id}
        onComplete={() => {
          loadExportLogs();
        }}
      />
    </div>
  );
}