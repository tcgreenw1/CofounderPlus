import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Loader2, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface Report {
  id: string;
  title: string;
  category: string;
  aiSummary: string;
  createdAt: string;
  data: any;
}

interface FinanceReportsSectionProps {
  reports: Report[];
  generatingReport: boolean;
  onDeleteReport: (reportId: string) => void;
}

export function FinanceReportsSection({ reports, generatingReport, onDeleteReport }: FinanceReportsSectionProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const categories = useMemo(() => {
    const cats = new Set(reports.map(r => r.category));
    return ['all', ...Array.from(cats)];
  }, [reports]);

  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.aiSummary.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(r => r.category === categoryFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [reports, searchQuery, categoryFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedReports.length / itemsPerPage);
  const paginatedReports = filteredAndSortedReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const toggleSort = (field: 'date' | 'title' | 'category') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); 
    }
  };

  return (
    <div 
      style={{ 
        marginTop: 'var(--spacing-8)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          padding: 'var(--spacing-4)',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Financial Reports</h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Tool-generated reports from quick actions (1 credit each)
              </p>
            </div>
          </div>
          {generatingReport && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ 
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-foreground)',
              border: '1px solid var(--primary)'
            }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Generating report...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: 'var(--background)' }}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" style={{ backgroundColor: 'var(--background)' }}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ overflow: 'auto' }}>
        {filteredAndSortedReports.length === 0 ? (
          <div 
            style={{ 
              padding: 'var(--spacing-8)',
              textAlign: 'center',
              color: 'var(--muted-foreground)'
            }}
          >
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p style={{ fontSize: '0.875rem' }}>
              No reports found.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr 
                style={{ 
                  backgroundColor: 'var(--muted)',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <th 
                  style={{ 
                    padding: 'var(--spacing-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Report
                    {sortField === 'title' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  style={{ 
                    padding: 'var(--spacing-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                  className="hidden md:table-cell"
                  onClick={() => toggleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  style={{ 
                    padding: 'var(--spacing-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--foreground)'
                  }}
                >
                  AI Summary
                </th>
                <th 
                  style={{ 
                    padding: 'var(--spacing-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                  className="hidden sm:table-cell"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {sortField === 'date' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  style={{ 
                    padding: 'var(--spacing-3)',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--foreground)'
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
                <tr 
                  key={report.id}
                  style={{ 
                    borderBottom: '1px solid var(--border)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-muted/50"
                >
                  <td 
                    style={{ 
                      padding: 'var(--spacing-3)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--foreground)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                      <span className="line-clamp-1">{report.title}</span>
                    </div>
                  </td>
                  <td 
                    style={{ 
                      padding: 'var(--spacing-3)',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)'
                    }}
                    className="hidden md:table-cell"
                  >
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: 'var(--muted)',
                        color: 'var(--muted-foreground)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      {report.category}
                    </Badge>
                  </td>
                  <td 
                    style={{ 
                      padding: 'var(--spacing-3)',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                      maxWidth: '400px'
                    }}
                  >
                    <p className="line-clamp-2">
                      {report.aiSummary}
                    </p>
                  </td>
                  <td 
                    style={{ 
                      padding: 'var(--spacing-3)',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                      whiteSpace: 'nowrap'
                    }}
                    className="hidden sm:table-cell"
                  >
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td 
                    style={{ 
                      padding: 'var(--spacing-3)',
                      textAlign: 'right'
                    }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            style={{
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              borderRadius: 'var(--radius-md)',
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent 
                          className="max-w-3xl max-h-[80vh] overflow-y-auto"
                          style={{
                            backgroundColor: 'var(--card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                              <div className="flex-1">
                                <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                  {report.title}
                                </DialogTitle>
                                <DialogDescription style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                                  Generated on {new Date(report.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </DialogDescription>
                              </div>
                              <Badge
                                style={{
                                  backgroundColor: 'var(--muted)',
                                  color: 'var(--muted-foreground)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--spacing-1) var(--spacing-2)',
                                }}
                              >
                                {report.category}
                              </Badge>
                            </div>
                          </DialogHeader>

                          <div style={{ marginTop: 'var(--spacing-4)' }}>
                            {/* AI Summary Section */}
                            <div 
                              style={{
                                padding: 'var(--spacing-4)',
                                backgroundColor: 'var(--muted)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--primary)' }}>
                                Executive Summary
                              </h4>
                              <p style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                                {report.aiSummary}
                              </p>
                            </div>

                            {/* Report Data Section */}
                            <div>
                              <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-3)', color: 'var(--foreground)' }}>
                                Detailed Data
                              </h4>
                              <div 
                                style={{
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--spacing-4)',
                                  fontFamily: 'monospace',
                                  fontSize: '0.875rem',
                                  overflow: 'auto',
                                  maxHeight: '400px'
                                }}
                              >
                                <pre style={{ margin: 0, color: 'var(--foreground)' }}>
                                  {JSON.stringify(report.data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteReport(report.id)}
                        style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          borderRadius: 'var(--radius-md)',
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div 
          style={{ 
            padding: 'var(--spacing-3)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--muted)'
          }}
        >
          <div className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedReports.length)} of {filteredAndSortedReports.length} reports
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}