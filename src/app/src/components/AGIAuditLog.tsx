import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  Hash
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface AGIAuditLogProps {
  businessId?: string;
  title?: string;
  description?: string;
  showHeader?: boolean;
  maxHeight?: string;
  pageSize?: number;
  onRefresh?: () => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  summary: string;
  recordsAffected: number;
  status: 'success' | 'failed' | 'in_progress';
  userId?: string;
  businessId?: string;
  metadata?: any;
}

const ACTION_ICONS: { [key: string]: any } = {
  'categorize': Tag,
  'create_rule': FileText,
  'detect_duplicates': Hash,
  'match_transfers': TrendingUp,
  'tax_summary': FileText,
  'export': Download,
  'recalculate': RefreshCw,
  'default': Sparkles
};

export function AGIAuditLog({
  businessId,
  title = 'AGI Audit Log',
  description = 'Track all AI-powered actions and automations',
  showHeader = true,
  maxHeight = '600px',
  pageSize = 10,
  onRefresh
}: AGIAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [businessId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, statusFilter]);

  const loadAuditLogs = async () => {
    if (!businessId) {
      setIsLoading(false);
      // Return empty array if no business selected
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      // Use the real bookkeeping status logs endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/status-logs?businessId=${businessId}`,
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
          // Transform status logs to audit log format
          const transformedLogs = (data.logs || []).map((log: any) => ({
            id: log.id,
            timestamp: log.date_time || log.created_at,
            action: log.action,
            summary: log.agi_summary || log.summary || '',
            recordsAffected: log.affected_records || 0,
            status: log.status,
            userId: log.user_id,
            businessId: log.business_id,
            metadata: log.metadata
          }));
          setLogs(transformedLogs);
        } else {
          // Empty array if not JSON
          console.log('AGI Audit Log API returned non-JSON response');
          setLogs([]);
        }
      } else {
        // Empty array if endpoint fails
        console.log('AGI Audit Log API not available');
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAuditLogs();
    setIsRefreshing(false);
    onRefresh?.();
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(query) ||
        log.summary.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusConfig = (status: AuditLogEntry['status']) => {
    switch (status) {
      case 'success':
        return {
          label: 'Success',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: XCircle,
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: Clock,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    for (const key in ACTION_ICONS) {
      if (lowerAction.includes(key)) {
        return ACTION_ICONS[key];
      }
    }
    return ACTION_ICONS.default;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading audit logs...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {title}
              </CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search actions or summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="failed">Failed Only</SelectItem>
                <SelectItem value="in_progress">In Progress Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredLogs.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
            </span>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="h-auto p-0 text-xs sm:text-sm text-blue-600"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Table - Desktop */}
        <div className="hidden md:block border rounded-lg overflow-hidden" style={{ maxHeight }}>
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                <TableRow>
                  <TableHead className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timestamp
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Action
                    </div>
                  </TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[120px] text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Hash className="w-4 h-4" />
                      Records
                    </div>
                  </TableHead>
                  <TableHead className="w-[110px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const statusConfig = getStatusConfig(log.status);
                    const StatusIcon = statusConfig.icon;
                    const ActionIcon = getActionIcon(log.action);

                    return (
                      <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatTimestamp(log.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500" title={formatFullTimestamp(log.timestamp)}>
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded">
                              <ActionIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {log.summary}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {log.recordsAffected.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusConfig.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-12 h-12 mb-2 text-gray-300" />
                        <p className="font-medium">No audit logs found</p>
                        <p className="text-sm mt-1">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'AGI actions will appear here'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => {
              const statusConfig = getStatusConfig(log.status);
              const StatusIcon = statusConfig.icon;
              const ActionIcon = getActionIcon(log.action);

              return (
                <Card key={log.id} className="border-l-4" style={{ borderLeftColor: statusConfig.color }}>
                  <CardContent className="p-3 space-y-2">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded flex-shrink-0">
                          <ActionIcon className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold truncate">{log.action}</span>
                      </div>
                      <Badge className={`${statusConfig.className} text-xs flex-shrink-0`}>
                        <StatusIcon className="w-2.5 h-2.5 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {log.summary}
                    </p>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span className="font-medium">{log.recordsAffected}</span> records
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mb-2 text-gray-300" />
              <p className="font-medium text-sm">No audit logs found</p>
              <p className="text-xs mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'AGI actions will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of{' '}
              {filteredLogs.length} entries
            </div>
            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2 sm:px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className="w-9 h-9 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded">
                {currentPage} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span className="hidden sm:inline">{logs.filter(l => l.status === 'success').length} successful</span>
              <span className="sm:hidden">{logs.filter(l => l.status === 'success').length} done</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-600" />
              {logs.filter(l => l.status === 'failed').length} failed
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              {logs.filter(l => l.status === 'in_progress').length} active
            </div>
          </div>
          <div className="w-full sm:w-auto text-right">
            <span className="hidden sm:inline">Total records affected: </span>
            <span className="font-medium">{logs.reduce((sum, log) => sum + log.recordsAffected, 0).toLocaleString()}</span>
            <span className="sm:hidden"> records</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data for demonstration
function getMockAuditLogs(): AuditLogEntry[] {
  const now = new Date();
  
  return [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      action: 'Auto Categorize All',
      summary: 'Automatically categorized uncategorized transactions using AI pattern matching',
      recordsAffected: 47,
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      action: 'Create Categorization Rule',
      summary: 'Created rule: "Amazon Web Services" → Cloud Services & Software',
      recordsAffected: 12,
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
      action: 'Detect Duplicates',
      summary: 'Scanned all transactions and identified potential duplicate entries',
      recordsAffected: 3,
      status: 'success'
    },
    {
      id: '4',
      timestamp: new Date(now.getTime() - 4 * 60 * 60000).toISOString(),
      action: 'Match Transfers',
      summary: 'Matched internal transfers between business accounts',
      recordsAffected: 8,
      status: 'success'
    },
    {
      id: '5',
      timestamp: new Date(now.getTime() - 6 * 60 * 60000).toISOString(),
      action: 'Prepare Tax Summary',
      summary: 'Generated comprehensive tax summary for Q1 2024',
      recordsAffected: 234,
      status: 'success'
    },
    {
      id: '6',
      timestamp: new Date(now.getTime() - 8 * 60 * 60000).toISOString(),
      action: 'Export Transaction Data',
      summary: 'Exported all transactions to CSV format for external accounting software',
      recordsAffected: 567,
      status: 'success'
    },
    {
      id: '7',
      timestamp: new Date(now.getTime() - 12 * 60 * 60000).toISOString(),
      action: 'Recalculate Quarterly Taxes',
      summary: 'Recalculated federal and state quarterly tax estimates based on current income',
      recordsAffected: 342,
      status: 'success'
    },
    {
      id: '8',
      timestamp: new Date(now.getTime() - 24 * 60 * 60000).toISOString(),
      action: 'Auto Categorize All',
      summary: 'Attempted to categorize transactions but encountered API rate limit',
      recordsAffected: 0,
      status: 'failed'
    },
    {
      id: '9',
      timestamp: new Date(now.getTime() - 36 * 60 * 60000).toISOString(),
      action: 'Generate Tax Package',
      summary: 'Created comprehensive tax package with Schedule C, P&L, and transaction exports',
      recordsAffected: 892,
      status: 'success'
    },
    {
      id: '10',
      timestamp: new Date(now.getTime() - 48 * 60 * 60000).toISOString(),
      action: 'Auto Categorize All',
      summary: 'Processing large batch of transactions from connected bank accounts',
      recordsAffected: 156,
      status: 'in_progress'
    },
    {
      id: '11',
      timestamp: new Date(now.getTime() - 72 * 60 * 60000).toISOString(),
      action: 'Create Categorization Rule',
      summary: 'Created rule: "Google Workspace" → Cloud Services & Software',
      recordsAffected: 18,
      status: 'success'
    },
    {
      id: '12',
      timestamp: new Date(now.getTime() - 96 * 60 * 60000).toISOString(),
      action: 'Detect Duplicates',
      summary: 'Full duplicate scan across all historical transactions',
      recordsAffected: 7,
      status: 'success'
    },
    {
      id: '13',
      timestamp: new Date(now.getTime() - 120 * 60 * 60000).toISOString(),
      action: 'Match Transfers',
      summary: 'Matched recurring transfers and identified transfer patterns',
      recordsAffected: 24,
      status: 'success'
    },
    {
      id: '14',
      timestamp: new Date(now.getTime() - 144 * 60 * 60000).toISOString(),
      action: 'Export Profit & Loss',
      summary: 'Generated and exported Profit & Loss statement for February 2024',
      recordsAffected: 412,
      status: 'success'
    },
    {
      id: '15',
      timestamp: new Date(now.getTime() - 168 * 60 * 60000).toISOString(),
      action: 'Auto Categorize All',
      summary: 'Categorized new transactions imported from bank feed',
      recordsAffected: 89,
      status: 'success'
    }
  ];
}