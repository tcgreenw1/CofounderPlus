import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, BarChart3, ListTodo, Lightbulb, Calendar, ArrowLeft, Loader2, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from './BusinessContext';

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

// Simple markdown to JSX converter
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
        codeBlockContent = [];
      } else {
        // End of code block
        inCodeBlock = false;
        elements.push(
          <pre
            key={i}
            style={{
              backgroundColor: 'var(--muted)',
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius)',
              overflow: 'auto',
              marginTop: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-3)',
              border: '1px solid var(--border)'
            }}
          >
            <code style={{ fontSize: '0.875rem', whiteSpace: 'pre' }}>
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} style={{ marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
          {line.replace('#### ', '')}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
          {line.replace('# ', '')}
        </h1>
      );
      continue;
    }

    // Handle list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={i} style={{ marginBottom: 'var(--spacing-1)', marginLeft: 'var(--spacing-6)' }}>
          {renderInlineMarkdown(line.trim().replace(/^[-*] /, ''))}
        </li>
      );
      continue;
    }

    // Handle numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <li key={i} style={{ marginBottom: 'var(--spacing-1)', marginLeft: 'var(--spacing-6)' }}>
          {renderInlineMarkdown(line.trim().replace(/^\d+\.\s/, ''))}
        </li>
      );
      continue;
    }

    // Handle empty lines
    if (line.trim() === '') {
      elements.push(<br key={i} />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ marginBottom: 'var(--spacing-3)', lineHeight: '1.6' }}>
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  return <div>{elements}</div>;
};

// Render inline markdown (bold, italic, inline code, links)
const renderInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Inline code (`code`)
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.substring(0, codeMatch.index));
      }
      parts.push(
        <code
          key={key++}
          style={{
            backgroundColor: 'var(--muted)',
            padding: '0.125rem 0.375rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875em'
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more special formatting
    parts.push(remaining);
    break;
  }

  return parts.length === 0 ? text : parts;
};

export function AutomationReportsPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<AutomationResult | null>(null);

  useEffect(() => {
    loadBusinessAndResults();
  }, [category, selectedType, selectedBusiness]);

  const loadBusinessAndResults = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        navigate('/auth');
        return;
      }

      // Get current business ID from BusinessContext
      if (!selectedBusiness?.id) {
        toast.error('No business selected');
        navigate('/dashboard');
        return;
      }

      // Fetch automation results
      const typeParam = selectedType !== 'all' ? `&type=${selectedType}` : '';
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/automations/results/${category}?businessId=${selectedBusiness.id}${typeParam}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setResults(data.results || []);
      } else {
        console.error('Failed to load automation results:', data);
        toast.error(data.error || 'Failed to load results');
      }
    } catch (error) {
      console.error('Error loading automation results:', error);
      toast.error('Failed to load automation results');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = () => {
    const categories: Record<string, { title: string; icon: any; color: string }> = {
      product: { title: 'Product', icon: Lightbulb, color: 'var(--chart-4)' },
      sales: { title: 'Sales', icon: BarChart3, color: 'var(--chart-1)' },
      marketing: { title: 'Marketing', icon: Lightbulb, color: 'var(--chart-5)' },
      finance: { title: 'Finance', icon: BarChart3, color: 'var(--chart-3)' },
      hr: { title: 'HR', icon: ListTodo, color: 'var(--chart-2)' },
      general: { title: 'General', icon: Calendar, color: 'var(--primary)' }
    };
    return categories[category || 'general'] || categories.general;
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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const renderResultPreview = (result: AutomationResult) => {
    if (typeof result.data === 'string') {
      return (
        <div style={{ 
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          maxHeight: '4.5rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {result.data.substring(0, 200)}...
        </div>
      );
    }
    
    return (
      <div style={{ 
        color: 'var(--muted-foreground)',
        fontSize: '0.875rem'
      }}>
        Structured data available
      </div>
    );
  };

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(r => r.storageType === selectedType);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', padding: 'var(--spacing-6)' }}>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <Loader2 className="size-8 animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', padding: 'var(--spacing-6)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/cofounder/settings')}
            style={{ 
              marginBottom: 'var(--spacing-4)',
              color: 'var(--muted-foreground)'
            }}
          >
            <ArrowLeft className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
            Back to Settings
          </Button>

          <div className="flex items-center" style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
            <div
              className="size-12 flex items-center justify-center"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: `color-mix(in srgb, ${categoryInfo.color} 15%, transparent)`,
                border: `2px solid ${categoryInfo.color}`
              }}
            >
              <CategoryIcon className="size-6" style={{ color: categoryInfo.color }} />
            </div>
            <div>
              <h1 style={{ marginBottom: 'var(--spacing-1)' }}>
                {categoryInfo.title} Automation Reports
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>
                View all automation results for {categoryInfo.title.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for storage types */}
        <Tabs value={selectedType} onValueChange={setSelectedType} style={{ marginBottom: 'var(--spacing-6)' }}>
          <TabsList style={{ backgroundColor: 'var(--muted)', padding: 'var(--spacing-1)' }}>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="report">
              <FileText className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Reports
            </TabsTrigger>
            <TabsTrigger value="data">
              <BarChart3 className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Data
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Insights
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results Grid */}
        {filteredResults.length === 0 ? (
          <Card style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-12)', textAlign: 'center' }}>
              <CategoryIcon 
                className="size-16 mx-auto opacity-30" 
                style={{ 
                  marginBottom: 'var(--spacing-4)',
                  color: 'var(--muted-foreground)' 
                }} 
              />
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No results yet</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Run automations from the Cofounder Settings page to see results here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResults.map((result) => {
              const StorageIcon = getStorageTypeIcon(result.storageType);
              
              return (
                <Card 
                  key={`${result.automationId}-${result.createdAt}`}
                  className="transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                  style={{
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--card)'
                  }}
                >
                  <CardHeader style={{ paddingBottom: 'var(--spacing-3)' }}>
                    <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-3)' }}>
                      <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
                        <div
                          className="size-10 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderRadius: 'var(--radius)',
                            background: `color-mix(in srgb, ${categoryInfo.color} 15%, transparent)`,
                            border: `1px solid ${categoryInfo.color}`
                          }}
                        >
                          <StorageIcon className="size-5" style={{ color: categoryInfo.color }} />
                        </div>
                        <div className="flex-1">
                          <CardTitle style={{ fontSize: '1rem', marginBottom: 'var(--spacing-1)' }}>
                            {result.automationTitle}
                          </CardTitle>
                          <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${categoryInfo.color} 10%, transparent)`,
                                color: categoryInfo.color,
                                borderColor: categoryInfo.color,
                                textTransform: 'capitalize'
                              }}
                            >
                              {result.storageType}
                            </Badge>
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {formatDate(result.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderResultPreview(result)}
                    <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(result);
                        }}
                        style={{
                          backgroundColor: categoryInfo.color,
                          color: 'white'
                        }}
                      >
                        <Eye className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
                        View Full Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
                          backgroundColor: `color-mix(in srgb, ${categoryInfo.color} 10%, transparent)`,
                          color: categoryInfo.color,
                          borderColor: categoryInfo.color,
                          textTransform: 'capitalize'
                        }}
                      >
                        {selectedResult.storageType}
                      </Badge>
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(selectedResult.createdAt)}
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
                    className="automation-report-content"
                    style={{ 
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius)',
                      padding: 'var(--spacing-6)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {typeof selectedResult.data === 'string' ? (
                      renderMarkdown(selectedResult.data)
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
      </div>
    </div>
  );
}