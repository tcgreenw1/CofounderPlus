import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  RefreshCw,
  DollarSign,
  Clock,
  Package
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CreditLog {
  userId: string;
  amount: number;
  action: string;
  remainingBalance: number;
  timestamp: string;
}

interface DiagnosticData {
  userId: string;
  timestamp: string;
  currentState: {
    credits: number;
    plan: string;
    subscriptions: Array<{
      id: string;
      plan: string;
      status: string;
      type: string;
    }>;
  };
  last24Hours: {
    totalDeducted: number;
    transactionCount: number;
    logs: CreditLog[];
  };
  last7Days: {
    totalLogs: number;
    largestDeduction: CreditLog | null;
    actionBreakdown: Record<string, { count: number; total: number }>;
    allLogs: CreditLog[];
  };
  usageTracking: {
    totalRecords: number;
    recentRecords: any[];
  };
  potentialIssues: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    details?: any;
  }>;
}

export function CreditDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchDiagnostic = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to view diagnostic');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/diagnostic`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiagnostic(data.diagnostic);
        console.log('📊 Credit Diagnostic:', data.diagnostic);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch diagnostic');
      }
    } catch (error: any) {
      console.error('Error fetching diagnostic:', error);
      toast.error('Error loading diagnostic data');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreCredits = async (amount: number, reason: string) => {
    setIsRestoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to restore credits');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, reason })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Restored ${amount} credits! New balance: ${data.newBalance}`);
        // Refresh diagnostic
        await fetchDiagnostic();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to restore credits');
      }
    } catch (error: any) {
      console.error('Error restoring credits:', error);
      toast.error('Error restoring credits');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading && !diagnostic) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">No diagnostic data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Credit Diagnostic Report</h1>
        <Button onClick={fetchDiagnostic} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Potential Issues */}
      {diagnostic.potentialIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-red-900 dark:text-red-100 mb-3">
                Potential Issues Detected
              </h2>
              <div className="space-y-3">
                {diagnostic.potentialIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 rounded p-4 border border-red-100 dark:border-red-900"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {issue.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{issue.message}</p>
                    {issue.details && (
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(issue.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Current Credits</h3>
          </div>
          <p className="text-3xl font-bold">{diagnostic.currentState.credits}</p>
          <p className="text-sm text-gray-500 mt-1">Plan: {diagnostic.currentState.plan}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold">Last 24 Hours</h3>
          </div>
          <p className="text-3xl font-bold">{diagnostic.last24Hours.totalDeducted}</p>
          <p className="text-sm text-gray-500 mt-1">
            {diagnostic.last24Hours.transactionCount} transactions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Last 7 Days</h3>
          </div>
          <p className="text-3xl font-bold">{diagnostic.last7Days.totalLogs}</p>
          <p className="text-sm text-gray-500 mt-1">total transactions</p>
        </motion.div>
      </div>

      {/* Action Breakdown */}
      {Object.keys(diagnostic.last7Days.actionBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold mb-4">Credit Usage by Action Type (Last 7 Days)</h3>
          <div className="space-y-3">
            {Object.entries(diagnostic.last7Days.actionBreakdown)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([action, stats]) => (
                <div
                  key={action}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{action}</p>
                    <p className="text-xs text-gray-500">{stats.count} times</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{stats.total} credits</p>
                    <p className="text-xs text-gray-500">
                      ~{Math.round(stats.total / stats.count)} per use
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Largest Deduction */}
      {diagnostic.last7Days.largestDeduction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold mb-4">Largest Single Deduction</h3>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{diagnostic.last7Days.largestDeduction.action}</p>
              <p className="text-sm text-gray-500">
                {formatDate(diagnostic.last7Days.largestDeduction.timestamp)}
              </p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              -{diagnostic.last7Days.largestDeduction.amount}
            </p>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {diagnostic.last24Hours.logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold mb-4">Recent Transactions (Last 24 Hours)</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {diagnostic.last24Hours.logs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">-{log.amount}</p>
                  <p className="text-xs text-gray-500">{log.remainingBalance} left</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subscriptions */}
      {diagnostic.currentState.subscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Active Subscriptions
          </h3>
          <div className="space-y-2">
            {diagnostic.currentState.subscriptions.map((sub, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div>
                  <p className="font-medium">{sub.plan}</p>
                  <p className="text-xs text-gray-500">{sub.type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  sub.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                  sub.status === 'trialing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Emergency Restore Button */}
      {diagnostic.currentState.credits < 1000 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
        >
          <h3 className="font-semibold mb-3">Emergency Credit Restoration</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you believe your credits were incorrectly deducted, you can restore them here.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => restoreCredits(5000, 'Bug investigation - incorrect deduction')}
              disabled={isRestoring}
              variant="outline"
            >
              {isRestoring ? 'Restoring...' : 'Restore 5,000 Credits'}
            </Button>
            <Button
              onClick={() => restoreCredits(20000, 'Plan reset - Builder tier full restore')}
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Restore to Full (20,000)'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-center">
        <Clock className="w-3 h-3 inline mr-1" />
        Report generated: {formatDate(diagnostic.timestamp)}
      </div>
    </div>
  );
}
