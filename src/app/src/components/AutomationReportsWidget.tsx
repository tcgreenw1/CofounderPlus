import React, { useState, useEffect } from 'react';
import { FileText, BarChart3, ListTodo, Lightbulb, Eye, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';

interface AutomationResult {
  automationId: string;
  automationTitle: string;
  category: string;
  storageType: 'report' | 'data' | 'tasks' | 'insights';
  format: 'markdown' | 'json' | 'structured';
  data: any;
  userInput: any;
  createdAt: string;
  expiresAt: string;
}

interface AutomationReportsWidgetProps {
  category: string;
  categoryColor: string;
  maxResults?: number;
}

export function AutomationReportsWidget({ 
  category, 
  categoryColor,
  maxResults = 5 
}: AutomationReportsWidgetProps) {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AutomationResult | null>(null);

  useEffect(() => {
    loadResults();
  }, [category, selectedBusiness]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      // Get current business ID from BusinessContext
      if (!selectedBusiness?.id) {
        setLoading(false);
        return;
      }

      // Fetch automation results
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/automations/results/${category}?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setResults((data.results || []).slice(0, maxResults));
      }
    } catch (error) {
      console.error('Error loading automation results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStorageTypeIcon = (type: string) => {
    switch (type) {
      case 'report': return FileText;
      case 'data': return BarChart3;
      case 'tasks': return ListTodo;
      case 'insights': return Lightbulb;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const renderResultPreview = (result: AutomationResult) => {
    if (typeof result.data === 'string') {
      return result.data.substring(0, 100) + (result.data.length > 100 ? '...' : '');
    }
    return 'Structured data available';
  };

  if (loading) {
    return (
      <Card style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ paddingBottom: 'var(--spacing-3)' }}>
          <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <FileText className="size-5" style={{ color: categoryColor }} />
            Automation Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ padding: 'var(--spacing-8)' }}>
          <Loader2 className="size-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ paddingBottom: 'var(--spacing-3)' }}>
          <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <FileText className="size-5" style={{ color: categoryColor }} />
            Automation Reports
          </CardTitle>
        </CardHeader>
        <CardContent style={{ textAlign: 'center', padding: 'var(--spacing-6)', color: 'var(--muted-foreground)' }}>
          <FileText className="size-12 mx-auto opacity-20" style={{ marginBottom: 'var(--spacing-3)' }} />
          <p className="text-sm">No automation reports yet</p>
          <p className="text-xs" style={{ marginTop: 'var(--spacing-1)' }}>
            Run automations from Cofounder Settings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ paddingBottom: 'var(--spacing-3)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <FileText className="size-5" style={{ color: categoryColor }} />
              Automation Reports
            </CardTitle>
            <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Badge variant="outline" style={{ borderColor: categoryColor, color: categoryColor }}>
                {results.length}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/automation-reports/${category}`)}
                className="flex items-center"
                style={{ gap: 'var(--spacing-1)' }}
              >
                View All
                <ExternalLink className="size-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {results.map((result, index) => {
              const StorageIcon = getStorageTypeIcon(result.storageType);
              
              return (
                <div
                  key={`${result.automationId}-${result.createdAt}`}
                  className="flex items-center justify-between hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedResult(result)}
                  style={{ padding: 'var(--spacing-3)' }}
                >
                  <div className="flex items-start flex-1" style={{ gap: 'var(--spacing-3)' }}>
                    <div
                      className="size-8 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderRadius: 'var(--radius)',
                        background: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
                        border: `1px solid ${categoryColor}`
                      }}
                    >
                      <StorageIcon className="size-4" style={{ color: categoryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <span className="text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {result.automationTitle}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {formatDate(result.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {renderResultPreview(result)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 'var(--spacing-4)' }}
          onClick={() => setSelectedResult(null)}
        >
          <Card 
            className="max-w-4xl w-full max-h-[90vh] overflow-auto"
            style={{
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--card)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'var(--card)',
              zIndex: 10,
              borderBottom: '1px solid var(--border)'
            }}>
              <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-4)' }}>
                <div>
                  <CardTitle style={{ marginBottom: 'var(--spacing-2)' }}>
                    {selectedResult.automationTitle}
                  </CardTitle>
                  <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
                    <Badge 
                      variant="outline"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${categoryColor} 10%, transparent)`,
                        color: categoryColor,
                        borderColor: categoryColor,
                        textTransform: 'capitalize'
                      }}
                    >
                      {selectedResult.storageType}
                    </Badge>
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      }).format(new Date(selectedResult.createdAt))}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResult(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 'var(--spacing-6)' }}>
              {/* User Input Section */}
              {selectedResult.userInput && Object.keys(selectedResult.userInput).length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                  <h3 style={{ marginBottom: 'var(--spacing-3)' }}>Input Parameters</h3>
                  <div 
                    style={{ 
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'var(--radius)',
                      padding: 'var(--spacing-4)'
                    }}
                  >
                    <pre style={{ 
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0
                    }}>
                      {JSON.stringify(selectedResult.userInput, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Result Content */}
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-3)' }}>Result</h3>
                <div 
                  style={{ 
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-4)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {typeof selectedResult.data === 'string' ? (
                    <div style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: '1.6'
                    }}>
                      {selectedResult.data}
                    </div>
                  ) : (
                    <pre style={{ 
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0
                    }}>
                      {JSON.stringify(selectedResult.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}