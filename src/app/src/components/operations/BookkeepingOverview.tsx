import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  FileX,
  Target,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { AGIAuditLog } from '../AGIAuditLog';

interface StatsData {
  uncategorized: number;
  accuracy: number;
  monthlyCloseStatus: 'pending' | 'in_progress' | 'completed';
  quarterlyTaxes: number;
  lastExport: string | null;
}

interface ActivityLog {
  id: string;
  date_time: string;
  action: string;
  affected_records: number;
  agi_summary: string;
  status: 'success' | 'warning' | 'error' | 'in_progress';
}

interface BookkeepingOverviewProps {
  user?: any;
  stats: StatsData;
  statusLogs: ActivityLog[];
  isRunning: boolean;
  runFullAutoBookkeeping: () => void;
  getStatusColor: (status: string) => string;
}

export function BookkeepingOverview({ 
  user, 
  stats: propsStats, 
  statusLogs: propsLogs, 
  isRunning: propsIsRunning,
  runFullAutoBookkeeping,
  getStatusColor 
}: BookkeepingOverviewProps) {
  const { selectedBusiness } = useBusiness();
  const [stats, setStats] = useState<StatsData>(propsStats);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(propsLogs);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRunningFull, setIsRunningFull] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setStats(propsStats);
  }, [propsStats]);

  useEffect(() => {
    setActivityLogs(propsLogs);
  }, [propsLogs]);

  useEffect(() => {
    if (selectedBusiness) {
      loadActivityLogs();
    }
  }, [selectedBusiness]);

  const loadActivityLogs = async () => {
    if (!selectedBusiness) return;

    setIsLoadingLogs(true);
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
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.logs) {
            setActivityLogs(data.logs);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleRunFullBookkeeping = async () => {
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
            userId: user.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Auto-bookkeeping completed successfully!');
        
        // Reload stats and logs
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCloseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getCloseStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const dashboardCards = [
    {
      title: 'Uncategorized Transactions',
      value: stats.uncategorized,
      icon: FileX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      trend: stats.uncategorized > 0 ? 'down' : 'neutral',
      link: 'View all uncategorized'
    },
    {
      title: 'AI Categorization Accuracy',
      value: `${stats.accuracy}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      trend: stats.accuracy >= 90 ? 'up' : 'neutral',
      link: 'View accuracy details'
    },
    {
      title: 'Monthly Close Status',
      value: getCloseStatusText(stats.monthlyCloseStatus),
      icon: Calendar,
      color: getCloseStatusColor(stats.monthlyCloseStatus),
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      trend: stats.monthlyCloseStatus === 'completed' ? 'up' : 'neutral',
      link: 'Go to Monthly Close'
    },
    {
      title: 'Estimated Quarterly Taxes',
      value: `$${stats.quarterlyTaxes.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      trend: 'neutral',
      link: 'View tax estimates'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold">Auto-Bookkeeping Overview</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Monitor your automated bookkeeping status and AGI activity
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                  </div>
                  {card.trend === 'up' && (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  )}
                  {card.trend === 'down' && (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-3">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${card.color} mb-1 sm:mb-2`}>
                  {card.value}
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700"
                >
                  {card.link}
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run Full Auto-Bookkeeping Button */}
      <div className="flex justify-center py-3 sm:py-4">
        <Button
          size="lg"
          onClick={runFullAutoBookkeeping}
          disabled={propsIsRunning}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm sm:text-lg px-6 sm:px-8 py-2 sm:py-3"
        >
          {propsIsRunning ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              <span className="hidden sm:inline">Running Auto-Bookkeeping...</span>
              <span className="sm:hidden">Running...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Run Full Auto-Bookkeeping</span>
              <span className="sm:hidden">Run Auto-Bookkeeping</span>
            </>
          )}
        </Button>
      </div>

      {/* AGI Activity Log */}
      <AGIAuditLog
        businessId={selectedBusiness?.id}
        title="Recent AGI Activity"
        description="Complete history of all automated bookkeeping actions"
        showHeader={true}
        maxHeight="500px"
        pageSize={10}
        onRefresh={loadActivityLogs}
      />
    </div>
  );
}