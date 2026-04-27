import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Shield,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface EstimatedQuarterlyTaxesCardProps {
  businessId?: string;
  year?: number;
  quarter?: number;
  onRecalculate?: () => void;
}

interface TaxEstimate {
  federalEstimate: number;
  stateEstimate: number;
  safeHarborStatus: 'met' | 'at-risk' | 'not-met' | 'unknown';
  nextDeadline: string;
  lastCalculated?: string;
}

export function EstimatedQuarterlyTaxesCard({
  businessId,
  year = new Date().getFullYear(),
  quarter = Math.ceil((new Date().getMonth() + 1) / 3),
  onRecalculate
}: EstimatedQuarterlyTaxesCardProps) {
  const [taxData, setTaxData] = useState<TaxEstimate>({
    federalEstimate: 0,
    stateEstimate: 0,
    safeHarborStatus: 'unknown',
    nextDeadline: '',
    lastCalculated: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    loadTaxEstimate();
  }, [businessId, year, quarter]);

  const loadTaxEstimate = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      console.log('💰 Loading quarterly tax estimate for business:', businessId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/tax/quarterly-estimate?businessId=${businessId}&year=${year}&quarter=${quarter}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('💰 Tax estimate loaded:', data);
        setTaxData(data);
      } else {
        console.warn('💰 Failed to load tax estimate - server returned:', response.status);
        // Keep empty/zero data - don't use mock data
        setTaxData({
          federalEstimate: 0,
          stateEstimate: 0,
          safeHarborStatus: 'unknown',
          nextDeadline: getDefaultDeadline(quarter),
          lastCalculated: undefined
        });
      }
    } catch (error) {
      console.error('Failed to load tax estimate:', error);
      // Keep empty/zero data on error - don't use mock data
      setTaxData({
        federalEstimate: 0,
        stateEstimate: 0,
        safeHarborStatus: 'unknown',
        nextDeadline: getDefaultDeadline(quarter),
        lastCalculated: undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!businessId) {
      toast.error('Please select a business first');
      return;
    }

    setIsRecalculating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsRecalculating(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/tax/recalculate-quarterly`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            year,
            quarter
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTaxData(data);
        toast.success('Tax estimates recalculated successfully!');
        onRecalculate?.();
      } else {
        toast.error('Failed to recalculate tax estimates');
      }
    } catch (error) {
      console.error('Recalculation error:', error);
      toast.error('An error occurred during recalculation');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getSafeHarborConfig = (status: TaxEstimate['safeHarborStatus']) => {
    switch (status) {
      case 'met':
        return {
          label: 'Safe Harbor Met',
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle2,
          iconColor: 'text-green-600'
        };
      case 'at-risk':
        return {
          label: 'At Risk',
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600'
        };
      case 'not-met':
        return {
          label: 'Not Met',
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: Info,
          iconColor: 'text-gray-600'
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const safeHarborConfig = getSafeHarborConfig(taxData.safeHarborStatus);
  const SafeHarborIcon = safeHarborConfig.icon;
  const totalEstimate = taxData.federalEstimate + taxData.stateEstimate;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Estimated Quarterly Taxes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading tax estimates...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Estimated Quarterly Taxes
            </CardTitle>
            <CardDescription className="mt-1">
              Q{quarter} {year} tax payment estimates
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="w-3 h-3 mr-1" />
            AGI
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Total Estimate - Prominent Display */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Estimated Payment
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(totalEstimate)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Federal Estimate */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Federal Estimate</p>
              <p className="text-xs text-gray-500">IRS quarterly payment</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">{formatCurrency(taxData.federalEstimate)}</p>
          </div>
        </div>

        {/* State Estimate */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">State Estimate</p>
              <p className="text-xs text-gray-500">State quarterly payment</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">{formatCurrency(taxData.stateEstimate)}</p>
          </div>
        </div>

        {/* Safe Harbor Status */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${safeHarborConfig.color.split(' ')[0]} dark:bg-opacity-20`}>
              <SafeHarborIcon className={`w-4 h-4 ${safeHarborConfig.iconColor}`} />
            </div>
            <div>
              <p className="font-medium text-sm">Safe Harbor Status</p>
              <p className="text-xs text-gray-500">Penalty protection status</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={safeHarborConfig.color}>
              {safeHarborConfig.label}
            </Badge>
          </div>
        </div>

        {/* Next Payment Deadline */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Next Payment Deadline</p>
              <p className="text-xs text-gray-500">IRS due date for Q{quarter}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatDate(taxData.nextDeadline)}</p>
          </div>
        </div>

        {/* Last Calculated Info */}
        {taxData.lastCalculated && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100 dark:border-gray-800">
            Last calculated: {new Date(taxData.lastCalculated).toLocaleString()}
          </div>
        )}

        {/* Recalculate Button */}
        <div className="pt-2">
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isRecalculating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Recalculate with AGI
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Default deadlines for quarters
function getDefaultDeadline(quarter: number): string {
  const year = new Date().getFullYear();
  const deadlines = {
    1: `${year}-04-15`,
    2: `${year}-06-15`,
    3: `${year}-09-15`,
    4: `${year + 1}-01-15`
  };

  return deadlines[quarter as keyof typeof deadlines] || `${year}-04-15`;
}