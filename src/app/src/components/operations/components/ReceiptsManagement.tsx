import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../ui/use-mobile';
import { toast } from 'sonner@2.0.3';
import {
  Receipt,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';

interface ReceiptJob {
  id: string;
  businessId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  imageUrl?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  errorDetails?: string;
  uploadedAt: string;
  processedAt?: string;
  extractedData?: {
    merchant?: string;
    total?: number;
    tax?: number;
    date?: string;
    confidence?: number;
    transactions?: any[];
  };
  transactionIds?: string[];
  creditsUsed?: number;
  tokensUsed?: number;
}

interface ReceiptsManagementProps {
  businessId: string;
  userId: string;
  onTransactionsCreated?: () => void;
}

export const ReceiptsManagement: React.FC<ReceiptsManagementProps> = ({
  businessId,
  userId,
  onTransactionsCreated
}) => {
  const isMobile = useIsMobile();
  const [receipts, setReceipts] = useState<ReceiptJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptJob | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load receipts from backend
  const loadReceipts = async () => {
    try {
      console.log('📋 Loading receipts for business:', businessId);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('❌ No access token available');
        toast.error('Please log in to view receipts');
        setLoading(false);
        return;
      }

      console.log('🔑 Access token obtained, fetching receipts...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/receipts?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Receipts loaded:', data.receipts?.length || 0);
        setReceipts(data.receipts || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load receipts:', response.status, errorText);
        toast.error('Failed to load receipts');
      }
    } catch (error) {
      console.error('❌ Error loading receipts:', error);
      toast.error('Error loading receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
    
    // Poll for updates every 5 seconds if there are processing receipts
    const interval = setInterval(() => {
      const hasProcessing = receipts.some(r => r.status === 'processing' || r.status === 'uploading');
      if (hasProcessing) {
        loadReceipts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [businessId, receipts.length]);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, HEIC, or WebP image.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Image = reader.result as string;

      // Submit for background processing
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/upload-receipt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            image: base64Image,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Receipt uploaded! Processing in background...');
        
        // Add to local state immediately
        const newReceipt: ReceiptJob = {
          id: data.receiptId,
          businessId,
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          status: 'processing',
          uploadedAt: new Date().toISOString()
        };
        setReceipts(prev => [newReceipt, ...prev]);
        
        // Reset input
        e.target.value = '';
      } else {
        const errorData = await response.json();
        toast.error(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  // Delete receipt
  const handleDelete = async (receiptId: string) => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/receipts/${receiptId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      if (response.ok) {
        toast.success('Receipt deleted');
        setReceipts(prev => prev.filter(r => r.id !== receiptId));
      } else {
        toast.error('Failed to delete receipt');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete receipt');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge 
            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge 
            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'uploading':
        return (
          <Badge 
            className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <Clock className="w-3 h-3 mr-1" />
            Uploading
          </Badge>
        );
      case 'failed':
        return (
          <Badge 
            className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get error explanation
  const getErrorExplanation = (error?: string, errorDetails?: string) => {
    if (!error) return null;

    const explanations: Record<string, { title: string; message: string; fix: string }> = {
      'Invalid file type': {
        title: 'Unsupported File Format',
        message: 'The file you uploaded is not a supported image format.',
        fix: 'Please upload a JPEG, PNG, HEIC, or WebP image file.'
      },
      'File too large': {
        title: 'File Size Too Large',
        message: 'The receipt image exceeds the maximum allowed size.',
        fix: 'Please compress the image or upload a file smaller than 10MB.'
      },
      'No receipt detected': {
        title: 'Receipt Not Detected',
        message: 'The AI could not identify a receipt in the image.',
        fix: 'Make sure the image contains a clear, readable receipt. Try taking a better photo with good lighting.'
      },
      'Unable to read receipt': {
        title: 'Receipt Unreadable',
        message: 'The receipt text could not be extracted from the image.',
        fix: 'Ensure the receipt is clearly visible, well-lit, and not blurry. Try retaking the photo.'
      },
      'No transactions found': {
        title: 'No Transaction Data Found',
        message: 'The AI processed the image but could not extract transaction details.',
        fix: 'Verify the image shows a complete receipt with amounts and items.'
      },
      'OpenAI API error': {
        title: 'AI Processing Error',
        message: 'There was an error communicating with the AI service.',
        fix: 'This is a temporary issue. Please try uploading again in a few moments.'
      },
      'Authentication required': {
        title: 'Authentication Error',
        message: 'Your session expired or authentication failed.',
        fix: 'Please refresh the page and log in again.'
      }
    };

    // Find matching explanation
    for (const [key, explanation] of Object.entries(explanations)) {
      if (error.includes(key)) {
        return explanation;
      }
    }

    // Default explanation for unknown errors
    return {
      title: 'Processing Error',
      message: error,
      fix: errorDetails || 'Please try again or contact support if the issue persists.'
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card 
        className="border-2 border-dashed"
        style={{ 
          borderColor: 'var(--color-primary)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <CardContent className={isMobile ? "p-4" : "p-6"}>
          <div className="text-center">
            <div 
              className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Camera className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="font-semibold mb-2">Upload Receipt</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Take a photo or upload an image of your receipt. We'll extract the transaction details automatically in the background. <strong>Cost: 20 credits per receipt.</strong>
            </p>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="receipt-upload-input"
              disabled={uploading}
            />
            <label htmlFor="receipt-upload-input">
              <Button
                disabled={uploading}
                asChild
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Receipt Image
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
              Supported: JPEG, PNG, HEIC, WebP • Max 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Card>
        <CardHeader className={isMobile ? "p-4 pb-2" : ""}>
          <div className="flex items-center justify-between">
            <CardTitle className={isMobile ? "text-base" : ""}>
              <Receipt className="w-5 h-5 inline-block mr-2" />
              Receipt History ({receipts.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadReceipts}
              className={isMobile ? "h-7 px-2" : ""}
            >
              <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "p-2" : "p-6"}>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p style={{ color: 'var(--color-muted-foreground)' }}>
                No receipts uploaded yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    receipt.status === 'failed' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                    receipt.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                    'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    borderColor: receipt.status === 'failed' || receipt.status === 'completed' ? undefined : 'var(--color-border)'
                  }}
                >
                  {/* Icon */}
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-8 h-8' : ''}`}
                    style={{
                      backgroundColor: receipt.status === 'failed' ? 'var(--destructive-soft)' :
                                       receipt.status === 'completed' ? 'var(--success-soft)' :
                                       'var(--color-muted)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {receipt.status === 'failed' ? (
                      <XCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: 'var(--destructive)' }} />
                    ) : receipt.status === 'completed' ? (
                      <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: 'var(--success)' }} />
                    ) : (
                      <ImageIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold truncate ${isMobile ? 'text-sm' : ''}`}>
                          {receipt.fileName}
                        </p>
                        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'}`} style={{ color: 'var(--color-muted-foreground)' }}>
                          {new Date(receipt.uploadedAt).toLocaleString()}
                          {receipt.fileSize && ` • ${(receipt.fileSize / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                      {getStatusBadge(receipt.status)}
                    </div>

                    {/* Success info */}
                    {receipt.status === 'completed' && receipt.extractedData && (
                      <div className={`mt-2 flex flex-wrap gap-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                        {receipt.extractedData.merchant && (
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-muted)' }}>
                            🏪 {receipt.extractedData.merchant}
                          </span>
                        )}
                        {receipt.extractedData.total && (
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-muted)' }}>
                            💵 ${receipt.extractedData.total.toFixed(2)}
                          </span>
                        )}
                        {receipt.transactionIds && (
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-muted)' }}>
                            ✅ {receipt.transactionIds.length} transaction{receipt.transactionIds.length !== 1 ? 's' : ''} created
                          </span>
                        )}
                        {receipt.creditsUsed !== undefined && (
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-muted)' }}>
                            ⚡ {receipt.creditsUsed} credit{receipt.creditsUsed !== 1 ? 's' : ''} used
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error info */}
                    {receipt.status === 'failed' && receipt.error && (
                      <div className="mt-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--destructive)' }} />
                          <div className={isMobile ? 'text-[10px]' : 'text-xs'}>
                            <p style={{ color: 'var(--destructive)' }} className="font-semibold">
                              {getErrorExplanation(receipt.error, receipt.errorDetails)?.title}
                            </p>
                            <p style={{ color: 'var(--color-muted-foreground)' }} className="mt-1">
                              {getErrorExplanation(receipt.error, receipt.errorDetails)?.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowDetails(true);
                        }}
                        className={isMobile ? "h-6 text-[10px] px-2" : "h-7 text-xs"}
                      >
                        <Eye className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1`} />
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(receipt.id)}
                        className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isMobile ? "h-6 text-[10px] px-2" : "h-7 text-xs"}`}
                      >
                        <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1`} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              Receipt Details
            </DialogTitle>
            <DialogDescription>
              {selectedReceipt?.fileName}
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-semibold block mb-2">Status</label>
                {getStatusBadge(selectedReceipt.status)}
              </div>

              {/* File Info */}
              <div>
                <label className="text-sm font-semibold block mb-2">File Information</label>
                <div className="text-sm space-y-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  <p>📁 {selectedReceipt.fileName}</p>
                  <p>📏 {(selectedReceipt.fileSize / 1024).toFixed(2)} KB</p>
                  <p>📅 Uploaded: {new Date(selectedReceipt.uploadedAt).toLocaleString()}</p>
                  {selectedReceipt.processedAt && (
                    <p>✅ Processed: {new Date(selectedReceipt.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Error Details */}
              {selectedReceipt.status === 'failed' && selectedReceipt.error && (
                <div className="p-4 rounded-lg border-2" style={{ 
                  backgroundColor: 'var(--destructive-soft)',
                  borderColor: 'var(--destructive)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--destructive)' }}>
                    <AlertCircle className="w-5 h-5" />
                    {getErrorExplanation(selectedReceipt.error, selectedReceipt.errorDetails)?.title}
                  </h4>
                  <p className="text-sm mb-3">
                    {getErrorExplanation(selectedReceipt.error, selectedReceipt.errorDetails)?.message}
                  </p>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    <p className="text-sm font-semibold mb-1">How to fix:</p>
                    <p className="text-sm">
                      {getErrorExplanation(selectedReceipt.error, selectedReceipt.errorDetails)?.fix}
                    </p>
                  </div>
                  {selectedReceipt.errorDetails && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-muted-foreground)' }}>
                        Technical Details
                      </summary>
                      <pre className="text-xs mt-2 p-2 rounded overflow-x-auto" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        {selectedReceipt.errorDetails}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Extracted Data */}
              {selectedReceipt.status === 'completed' && selectedReceipt.extractedData && (
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: 'var(--success-soft)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--success)' }}>
                    <CheckCircle className="w-5 h-5" />
                    Extracted Data
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedReceipt.extractedData.merchant && (
                      <p><span className="font-semibold">Merchant:</span> {selectedReceipt.extractedData.merchant}</p>
                    )}
                    {selectedReceipt.extractedData.total && (
                      <p><span className="font-semibold">Total:</span> ${selectedReceipt.extractedData.total.toFixed(2)}</p>
                    )}
                    {selectedReceipt.extractedData.tax && (
                      <p><span className="font-semibold">Tax:</span> ${selectedReceipt.extractedData.tax.toFixed(2)}</p>
                    )}
                    {selectedReceipt.extractedData.date && (
                      <p><span className="font-semibold">Date:</span> {selectedReceipt.extractedData.date}</p>
                    )}
                    {selectedReceipt.extractedData.confidence !== undefined && (
                      <p><span className="font-semibold">Confidence:</span> {(selectedReceipt.extractedData.confidence * 100).toFixed(0)}%</p>
                    )}
                    {selectedReceipt.transactionIds && selectedReceipt.transactionIds.length > 0 && (
                      <p><span className="font-semibold">Transactions Created:</span> {selectedReceipt.transactionIds.length}</p>
                    )}
                    {selectedReceipt.creditsUsed !== undefined && (
                      <p><span className="font-semibold">Credits Used:</span> ⚡ {selectedReceipt.creditsUsed}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};