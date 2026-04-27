import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AutoBookkeepingOverviewProps {
  user: any;
}

interface Stats {
  uncategorized: number;
  accuracy: number;
  monthlyCloseStatus: 'pending' | 'in_progress' | 'completed' | 'blocked';
  quarterlyTaxes: number;
  lastExport: string | null;
}

interface ActivityLog {
  id: string;
  date_time: string;
  action: string;
  affected_records: number;
  agi_summary: string;
  status: 'success' | 'warning' | 'error';
}

export function AutoBookkeepingOverview({ user }: AutoBookkeepingOverviewProps) {
  const { selectedBusiness } = useBusiness();
  const [stats, setStats] = useState<Stats>({
    uncategorized: 0,
    accuracy: 0,
    monthlyCloseStatus: 'pending',
    quarterlyTaxes: 0,
    lastExport: null
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningFull, setIsRunningFull] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (selectedBusiness) {
      loadStats();
      loadActivityLogs();
    }
  }, [selectedBusiness]);

  const loadStats = async () => {
    if (!selectedBusiness) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/stats?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    if (!selectedBusiness) return;

    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/status-logs?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          setActivityLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const runFullAutoBookkeeping = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsRunningFull(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/run-full`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            userId: user?.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Auto-Bookkeeping completed! Processed ${data.affectedRecords || 0} records.`);
        
        // Reload stats and logs
        await loadStats();
        await loadActivityLogs();
      } else {
        toast.error('Failed to run auto-bookkeeping');
      }
    } catch (error) {
      console.error('Auto-bookkeeping error:', error);
      toast.error('An error occurred during auto-bookkeeping');
    } finally {
      setIsRunningFull(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getCloseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Auto-Bookkeeping Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your automated bookkeeping status and AGI activity
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uncategorized Transactions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span>Uncategorized</span>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  {stats.uncategorized}
                </span>
                <span className="text-sm text-gray-500">transactions</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {stats.uncategorized > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-orange-500" />
                    <span className="text-orange-600">Needs attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">All caught up!</span>
                  </>
                )}
              </div>
              <Button variant="link" className="h-auto p-0 text-xs text-purple-600">
                View details →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Categorization Accuracy */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span>AI Accuracy</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-600">
                  {stats.accuracy}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {stats.accuracy >= 90 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">Excellent performance</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-yellow-500" />
                    <span className="text-yellow-600">Improving</span>
                  </>
                )}
              </div>
              <Button variant="link" className="h-auto p-0 text-xs text-purple-600">
                View details →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Close Status */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span>Monthly Close</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                {getCloseStatusBadge(stats.monthlyCloseStatus)}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <Button variant="link" className="h-auto p-0 text-xs text-purple-600">
                View details →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Quarterly Taxes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span>Quarterly Taxes</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  ${stats.quarterlyTaxes.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Q4 2024 estimate</span>
              </div>
              <Button variant="link" className="h-auto p-0 text-xs text-purple-600">
                View details →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Full Auto-Bookkeeping Button */}
      <div className="flex justify-center py-4">
        <Button
          onClick={runFullAutoBookkeeping}
          disabled={isRunningFull}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-base"
        >
          {isRunningFull ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Running Auto-Bookkeeping...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Run Full Auto-Bookkeeping
            </>
          )}
        </Button>
      </div>

      {/* AGI Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                AGI Activity Log
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Recent automated bookkeeping activities
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadActivityLogs}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Date/Time
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Affected Records
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Summary
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(log.date_time).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <Badge variant="outline" className="text-xs">
                          {log.affected_records}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        <div className="truncate" title={log.agi_summary}>
                          {log.agi_summary}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(log.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No activity yet</p>
              <p className="text-sm text-gray-400">
                Run auto-bookkeeping to see AGI activity logs here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
