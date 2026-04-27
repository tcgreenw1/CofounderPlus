import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  Briefcase,
  UserCheck,
  Loader2,
  Zap,
  Check,
  Download,
  Trash2,
  Eye,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { useCredits } from '../../hooks/useCredits';

const hrDocumentActions = [
  {
    id: 'create-handbook',
    label: 'Create Handbook',
    icon: FileText,
    color: '#6c5ce7',
    description: 'Generate employee handbook',
    documentType: 'employee-handbook'
  },
  {
    id: 'onboarding-guide',
    label: 'Onboarding Guide',
    icon: UserCheck,
    color: '#00b894',
    description: 'New hire onboarding materials',
    documentType: 'onboarding-checklist'
  },
  {
    id: 'policy-document',
    label: 'Policy Document',
    icon: FileText,
    color: '#e17055',
    description: 'Company policies & procedures',
    documentType: 'policy-document'
  },
  {
    id: 'review-template',
    label: 'Review Template',
    icon: Award,
    color: '#fd79a8',
    description: 'Performance review forms',
    documentType: 'performance-review'
  },
  {
    id: 'benefits-guide',
    label: 'Benefits Guide',
    icon: FileText,
    color: '#0984e3',
    description: 'Employee benefits overview',
    documentType: 'benefits-guide'
  },
  {
    id: 'contractor-research',
    label: 'Contractor Research',
    icon: Briefcase,
    color: '#fdcb6e',
    description: 'Find & hire contractors',
    documentType: 'contractor-research'
  },
  {
    id: 'job-description',
    label: 'Job Description',
    icon: Briefcase,
    color: '#00b894',
    description: 'Role descriptions & requirements',
    documentType: 'job-description'
  }
];

interface HRDocumentGeneratorProps {
  user?: any;
}

export function HRDocumentGenerator({ user }: HRDocumentGeneratorProps) {
  const { selectedBusiness } = useBusiness();
  const { checkCredits, deductCredits } = useCredits();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);

  // Generated documents state
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'createdAt' | 'title'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterDocumentType, setFilterDocumentType] = useState<string>('all');

  // Load saved documents on mount and when business changes
  useEffect(() => {
    if (selectedBusiness?.id && user?.id) {
      loadSavedDocuments();
    }
  }, [selectedBusiness?.id, user?.id]);

  const loadSavedDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/documents?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleViewDocument = (doc: any) => {
    setViewingDocument(doc);
    setShowViewDialog(true);
  };

  const handleDownloadDocument = (doc: any) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Document downloaded!');
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/documents/${docId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setSavedDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast.success('Document deleted successfully');
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const toggleSort = (field: 'createdAt' | 'title') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = savedDocuments
    .filter(doc => {
      // Filter by search query
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filter by document type
      if (filterDocumentType !== 'all' && doc.documentType !== filterDocumentType) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'createdAt') {
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        return multiplier * a.title.localeCompare(b.title);
      }
    });

  const handleActionClick = (action: any) => {
    setSelectedAction(action);
    setAdditionalContext('');
    setGeneratedDocument(null);
    setShowDialog(true);
  };

  const handleGenerate = async () => {
    if (!selectedBusiness?.id) {
      toast.error('Please select a business first');
      return;
    }

    // Check credits
    const hasCredits = await checkCredits(10);
    if (!hasCredits) {
      toast.error('Insufficient credits. You need 10 credits to generate an HR document.');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in to generate documents');
        return;
      }

      console.log('🤖 Generating HR document:', selectedAction.documentType);

      const requestBody = {
        documentType: selectedAction.documentType,
        businessId: selectedBusiness.id,
        additionalContext: additionalContext.trim()
      };
      
      console.log('📤 Sending request body:', requestBody);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/generate-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }

      const data = await response.json();

      if (data.success && data.document) {
        // Deduct credits
        await deductCredits(10);

        setGeneratedDocument(data.document);
        
        // Reload documents list to include the newly generated document
        await loadSavedDocuments();
        
        toast.success(`✅ ${selectedAction.label} generated! 10 credits deducted.`);
      } else {
        throw new Error(data.error || 'Failed to generate document');
      }

    } catch (error: any) {
      console.error('❌ Generate document error:', error);
      toast.error(`Failed to generate document: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedDocument) return;

    const blob = new Blob([generatedDocument.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDocument.title.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Document downloaded!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Header */}
      <Alert
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--spacing-6)',
          border: 'none',
        }}
      >
        <Zap className="w-6 h-6" />
        <AlertDescription style={{ marginTop: 'var(--spacing-2)' }}>
          <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>
            AI-Powered HR Document Generation
          </p>
          <p style={{ opacity: 0.9 }}>
            Generate professional HR documents with GPT-4o. Each document costs 10 credits and is tailored to your business.
          </p>
        </AlertDescription>
      </Alert>

      {/* Document Actions Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        style={{ gap: 'var(--spacing-3)' }}
      >
        {hrDocumentActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
              style={{
                background: 'var(--background)',
                borderRadius: 'var(--radius-xl)',
              }}
              onClick={() => handleActionClick(action)}
            >
              <CardContent
                className="flex flex-col items-center text-center"
                style={{
                  padding: 'var(--spacing-4)',
                  gap: 'var(--spacing-2)',
                }}
              >
                {/* Credit badge */}
                <Badge
                  variant="secondary"
                  style={{
                    position: 'absolute',
                    top: 'var(--spacing-2)',
                    right: 'var(--spacing-2)',
                    fontSize: '0.625rem',
                    padding: '2px 6px',
                    background: 'var(--primary)',
                    color: 'white',
                  }}
                >
                  10 credits
                </Badge>

                <div
                  style={{
                    background: `${action.color}15`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-1)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {action.label}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          style={{
            maxWidth: generatedDocument ? '800px' : '500px',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              {selectedAction && (
                <>
                  <selectedAction.icon className="w-5 h-5" style={{ color: selectedAction.color }} />
                  {selectedAction.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {generatedDocument
                ? 'Your document has been generated successfully'
                : `Generate a professional ${selectedAction?.label.toLowerCase()} using AI. Costs 10 credits.`}
            </DialogDescription>
          </DialogHeader>

          {!generatedDocument ? (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
              {/* Additional Context */}
              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any specific details you want included in the document..."
                  rows={4}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate (10 credits)
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
              {/* Success Message */}
              <Alert
                style={{
                  background: 'var(--success)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                }}
              >
                <Check className="w-5 h-5" />
                <AlertDescription style={{ marginLeft: 'var(--spacing-2)' }}>
                  Document generated successfully! Preview below.
                </AlertDescription>
              </Alert>

              {/* Document Preview */}
              <div
                style={{
                  background: 'var(--muted)',
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                >
                  {generatedDocument.content}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setGeneratedDocument(null);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Saved Documents Section */}
      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <Card
          className="border-none"
          style={{
            background: 'var(--background)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <CardContent
            className="flex flex-col"
            style={{
              padding: 'var(--spacing-4)',
              gap: 'var(--spacing-2)',
            }}
          >
            <CardDescription
              style={{
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Saved Documents
            </CardDescription>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row" style={{ gap: 'var(--spacing-2)' }}>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
              <select
                value={filterDocumentType}
                onChange={(e) => setFilterDocumentType(e.target.value)}
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <option value="all">All Document Types</option>
                {hrDocumentActions.map(action => (
                  <option key={action.documentType} value={action.documentType}>{action.label}</option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => toggleSort('createdAt')}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort by Date {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleSort('title')}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort by Title {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>

            {/* Documents List */}
            {isLoadingDocuments ? (
              <div className="flex justify-center" style={{ marginTop: 'var(--spacing-4)' }}>
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredAndSortedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--spacing-3)' }}>
                {filteredAndSortedDocuments.map(doc => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
                    style={{
                      background: 'var(--background)',
                      borderRadius: 'var(--radius-xl)',
                    }}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <CardContent
                      className="flex flex-col items-center text-center"
                      style={{
                        padding: 'var(--spacing-4)',
                        gap: 'var(--spacing-2)',
                      }}
                    >
                      <div
                        style={{
                          background: `${doc.color}15`,
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--spacing-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText className="w-6 h-6" style={{ color: doc.color }} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-1)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {doc.title}
                        </p>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col" style={{ gap: 'var(--spacing-2)', width: '100%' }}>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc);
                          }}
                          style={{
                            width: '100%',
                            borderRadius: 'var(--radius-lg)',
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(doc);
                            }}
                            style={{
                              flex: 1,
                              borderRadius: 'var(--radius-lg)',
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                            style={{
                              flex: 1,
                              borderRadius: 'var(--radius-lg)',
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex justify-center" style={{ marginTop: 'var(--spacing-4)' }}>
                <p style={{ color: 'var(--muted-foreground)' }}>No documents found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent
          style={{
            maxWidth: '800px',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              {viewingDocument && (
                <>
                  <FileText className="w-5 h-5" style={{ color: viewingDocument.color }} />
                  {viewingDocument.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewingDocument
                ? 'View your saved document'
                : 'No document selected'}
            </DialogDescription>
          </DialogHeader>

          {viewingDocument ? (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
              {/* Document Preview */}
              <div
                style={{
                  background: 'var(--muted)',
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                >
                  {viewingDocument.content}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    setViewingDocument(null);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadDocument(viewingDocument)}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" style={{ marginTop: 'var(--spacing-4)' }}>
              <p style={{ color: 'var(--muted-foreground)' }}>No document selected.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}