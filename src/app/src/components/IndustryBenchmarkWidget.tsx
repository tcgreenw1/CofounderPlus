import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, Info, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface IndustryBenchmarkWidgetProps {
  businessId: string;
}

interface BenchmarkMetric {
  name: string;
  yourValue: number;
  industryAverage: number;
  unit: string;
  displayFormat: 'percentage' | 'currency' | 'number' | 'ratio';
  status: 'above' | 'below' | 'at-par';
  difference: number;
  icon: string;
}

interface BenchmarkData {
  industry: string;
  businessStage: string;
  metrics: BenchmarkMetric[];
  overallRanking: 'top-quartile' | 'above-average' | 'average' | 'below-average';
  lastUpdated: string;
}

export const IndustryBenchmarkWidget: React.FC<IndustryBenchmarkWidgetProps> = ({ businessId }) => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('📊 Fetching industry benchmarks for:', businessId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/industry-benchmarks/${businessId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch benchmarks');
      }

      const data = await response.json();
      console.log('📊 Benchmark data:', data);
      setBenchmarkData(data);
    } catch (err: any) {
      console.error('❌ Error fetching benchmarks:', err);
      setError(err.message || 'Failed to load benchmarks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have a valid businessId (not temporary or invalid)
    if (businessId && !businessId.startsWith('temp-') && businessId !== 'null' && businessId !== 'undefined') {
      fetchBenchmarks();
    } else {
      console.log('📊 Skipping benchmarks fetch - invalid businessId:', businessId);
      setIsLoading(false);
    }
  }, [businessId]);

  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'ratio':
        return `${value.toFixed(2)}x`;
      case 'number':
        return value.toLocaleString();
      default:
        return `${value}${unit}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'above':
        return 'var(--success)';
      case 'below':
        return 'var(--destructive)';
      case 'at-par':
        return '#f59e0b'; // amber
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getRankingBadgeColor = (ranking: string) => {
    switch (ranking) {
      case 'top-quartile':
        return { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: 'var(--success)' };
      case 'above-average':
        return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', color: '#3b82f6' };
      case 'average':
        return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' };
      case 'below-average':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: 'var(--destructive)' };
      default:
        return { bg: 'var(--muted)', border: 'var(--border)', color: 'var(--muted-foreground)' };
    }
  };

  const getRankingLabel = (ranking: string) => {
    switch (ranking) {
      case 'top-quartile':
        return 'Top 25%';
      case 'above-average':
        return 'Above Average';
      case 'average':
        return 'Average';
      case 'below-average':
        return 'Below Average';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card style={{ borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--card)' }}>
        <CardHeader style={{ padding: 'var(--spacing-5)' }}>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
            <div
              className="size-10 flex items-center justify-center flex-shrink-0"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <BarChart3 className="size-5" style={{ color: '#6366f1' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>Industry Benchmarks</CardTitle>
              <CardDescription>Analyzing industry comparisons...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0 }}>
          <div className="flex items-center justify-center" style={{ padding: 'var(--spacing-8)' }}>
            <Loader2 className="size-8 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--card)' }}>
        <CardHeader style={{ padding: 'var(--spacing-5)' }}>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
            <div
              className="size-10 flex items-center justify-center flex-shrink-0"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertCircle className="size-5" style={{ color: 'var(--destructive)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>Industry Benchmarks</CardTitle>
              <CardDescription>Unable to load benchmark data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0 }}>
          <div className="text-center" style={{ padding: 'var(--spacing-4)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBenchmarks}
              className="inline-flex items-center"
              style={{ gap: 'var(--spacing-2)' }}
            >
              <RefreshCw className="size-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!benchmarkData) return null;

  const rankingColors = getRankingBadgeColor(benchmarkData.overallRanking);

  return (
    <Card style={{ borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--card)' }}>
      <CardHeader style={{ padding: 'var(--spacing-5)' }}>
        <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-3)' }}>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)', flex: 1, minWidth: 0 }}>
            <div
              className="size-10 flex items-center justify-center flex-shrink-0"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <BarChart3 className="size-5" style={{ color: '#6366f1' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                Industry Benchmarks
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-4 cursor-help" style={{ color: 'var(--muted-foreground)' }} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Compare your key metrics against industry averages for {benchmarkData.industry} businesses
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                <span>{benchmarkData.industry}</span>
                <span style={{ color: 'var(--muted-foreground)' }}>•</span>
                <span className="capitalize">{benchmarkData.businessStage}</span>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBenchmarks}
            className="size-8 p-0 flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0 }}>
        {/* Overall Ranking Badge */}
        <div className="flex items-center justify-center" style={{ marginBottom: 'var(--spacing-5)' }}>
          <Badge
            className="flex items-center"
            style={{
              backgroundColor: rankingColors.bg,
              color: rankingColors.color,
              border: `1px solid ${rankingColors.border}`,
              padding: 'var(--spacing-2) var(--spacing-3)',
              gap: 'var(--spacing-2)',
              fontSize: '0.875rem'
            }}
          >
            {benchmarkData.overallRanking === 'top-quartile' && <Award className="size-4" />}
            {benchmarkData.overallRanking === 'above-average' && <TrendingUp className="size-4" />}
            {benchmarkData.overallRanking === 'below-average' && <TrendingDown className="size-4" />}
            {benchmarkData.overallRanking === 'average' && <Target className="size-4" />}
            Performance: {getRankingLabel(benchmarkData.overallRanking)}
          </Badge>
        </div>

        {/* Metrics Comparison */}
        <div className="space-y-4">
          {benchmarkData.metrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                  <span style={{ fontSize: '1rem' }}>{metric.icon}</span>
                  <span className="text-sm" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                    {metric.name}
                  </span>
                </div>
                <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-right">
                          <div className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                            {formatValue(metric.yourValue, metric.displayFormat, metric.unit)}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            vs {formatValue(metric.industryAverage, metric.displayFormat, metric.unit)}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Industry average: {formatValue(metric.industryAverage, metric.displayFormat, metric.unit)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {metric.status === 'above' && (
                    <TrendingUp className="size-4" style={{ color: getStatusColor(metric.status) }} />
                  )}
                  {metric.status === 'below' && (
                    <TrendingDown className="size-4" style={{ color: getStatusColor(metric.status) }} />
                  )}
                  {metric.status === 'at-par' && (
                    <div 
                      className="size-2 rounded-full" 
                      style={{ backgroundColor: getStatusColor(metric.status) }}
                    />
                  )}
                </div>
              </div>

              {/* Visual comparison bar */}
              <div className="relative" style={{ height: '8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
                {/* Industry average marker */}
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    left: '50%',
                    width: '2px',
                    backgroundColor: 'var(--border)',
                    zIndex: 1
                  }}
                />
                
                {/* Your performance bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (metric.yourValue / (metric.industryAverage * 2)) * 100)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  style={{
                    height: '100%',
                    backgroundColor: getStatusColor(metric.status),
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>

              {/* Difference indicator */}
              <div className="flex justify-end" style={{ marginTop: 'var(--spacing-1)' }}>
                <span 
                  className="text-xs"
                  style={{ 
                    color: getStatusColor(metric.status),
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  {metric.difference > 0 ? '+' : ''}{metric.difference.toFixed(1)}% vs industry
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <div 
          className="text-xs text-center" 
          style={{ 
            color: 'var(--muted-foreground)', 
            marginTop: 'var(--spacing-5)',
            paddingTop: 'var(--spacing-4)',
            borderTop: '1px solid var(--border)'
          }}
        >
          <p style={{ marginBottom: 'var(--spacing-1)' }}>
            Benchmarks based on {benchmarkData.industry} industry data
          </p>
          <p>Last updated: {new Date(benchmarkData.lastUpdated).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};
