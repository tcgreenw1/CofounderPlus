import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Calendar, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RenewalStatus {
  userId: string;
  currentCredits: number;
  plan: string;
  renewalDate: string | null;
  daysUntilRenewal: number | null;
  isOverdue: boolean;
  lastRenewal: {
    timestamp: string;
    previousBalance: number;
    monthlyAllocation: number;
    rolledOver: number;
    newBalance: number;
    capped: boolean;
    rolloverCap: number;
  } | null;
}

export function CreditRenewalInfo() {
  const [renewalStatus, setRenewalStatus] = useState<RenewalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchRenewalStatus = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/renewal/status`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRenewalStatus(data);
      } else {
        console.error('Failed to fetch renewal status');
      }
    } catch (error: any) {
      console.error('Error fetching renewal status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualRenewal = async () => {
    setIsRenewing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to trigger renewal');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/renewal/trigger`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Credits renewed! Added ${data.monthlyAllocation} credits${data.rolledOver > 0 ? ` + ${data.rolledOver} rolled over` : ''}`,
          { duration: 5000 }
        );
        await fetchRenewalStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to trigger renewal');
      }
    } catch (error: any) {
      console.error('Error triggering renewal:', error);
      toast.error('Error triggering renewal');
    } finally {
      setIsRenewing(false);
    }
  };

  useEffect(() => {
    fetchRenewalStatus();
  }, []);

  if (isLoading || !renewalStatus) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Credit Renewal</h3>
        </div>
        <Button 
          onClick={fetchRenewalStatus} 
          variant="ghost" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-bold">{renewalStatus.currentCredits.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Plan</p>
            <p className="text-2xl font-bold capitalize">{renewalStatus.plan}</p>
          </div>
        </div>

        {/* Renewal Date */}
        {renewalStatus.renewalDate && (
          <div className={`p-4 rounded-lg ${
            renewalStatus.isOverdue 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              {renewalStatus.isOverdue ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium mb-1">
                  {renewalStatus.isOverdue ? 'Renewal Overdue' : 'Next Renewal'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(renewalStatus.renewalDate)}
                  {renewalStatus.daysUntilRenewal !== null && (
                    <span className="ml-2">
                      ({renewalStatus.daysUntilRenewal > 0 
                        ? `in ${renewalStatus.daysUntilRenewal} day${renewalStatus.daysUntilRenewal !== 1 ? 's' : ''}`
                        : renewalStatus.daysUntilRenewal === 0
                        ? 'today'
                        : `${Math.abs(renewalStatus.daysUntilRenewal)} day${Math.abs(renewalStatus.daysUntilRenewal) !== 1 ? 's' : ''} ago`
                      })
                    </span>
                  )}
                </p>
                {renewalStatus.isOverdue && (
                  <Button
                    onClick={triggerManualRenewal}
                    disabled={isRenewing}
                    size="sm"
                    className="mt-3"
                  >
                    {isRenewing ? 'Renewing...' : 'Renew Now'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last Renewal Info */}
        {renewalStatus.lastRenewal && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium">Last Renewal</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(renewalStatus.lastRenewal.timestamp)}</p>
              </div>
              <div>
                <p className="text-gray-500">Credits Added</p>
                <p className="font-medium text-green-600">
                  +{renewalStatus.lastRenewal.monthlyAllocation.toLocaleString()}
                </p>
              </div>
              {renewalStatus.lastRenewal.rolledOver > 0 && (
                <>
                  <div>
                    <p className="text-gray-500">Rolled Over</p>
                    <p className="font-medium text-blue-600">
                      +{renewalStatus.lastRenewal.rolledOver.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Final Balance</p>
                    <p className="font-medium">
                      {renewalStatus.lastRenewal.newBalance.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
              {renewalStatus.lastRenewal.capped && (
                <div className="col-span-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Rollover capped at {renewalStatus.lastRenewal.rolloverCap.toLocaleString()} credits
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>How it works:</strong> Your credits renew automatically every 30 days. 
            Unused credits roll over up to 2x your monthly allocation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
