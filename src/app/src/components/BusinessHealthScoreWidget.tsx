import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react';
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

interface BusinessHealthScoreWidgetProps {
  businessId: string;
}

interface HealthScoreData {
  overallScore: number;
  trend: 'up' | 'down' | 'stable';
  metrics: {
    financial: { score: number; status: string };
    operational: { score: number; status: string };
    growth: { score: number; status: string };
    team: { score: number; status: string };
  };
  insights: string[];
  recommendations: string[];
  lastUpdated: string;
}

export const BusinessHealthScoreWidget: React.FC<BusinessHealthScoreWidgetProps> = ({ businessId }) => {
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthScore = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('🏥 Fetching business health score for:', businessId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/business-health/${businessId}`,
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
        throw new Error(errorData.error || 'Failed to fetch health score');
      }

      const data = await response.json();
      console.log('🏥 Health score data:', data);
      setHealthData(data);
    } catch (err: any) {
      console.error('❌ Error fetching health score:', err);
      setError(err.message || 'Failed to load health score');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have a valid businessId (not temporary or invalid)
    if (businessId && !businessId.startsWith('temp-') && businessId !== 'null' && businessId !== 'undefined') {
      fetchHealthScore();
    } else {
      console.log('🏥 Skipping health score fetch - invalid businessId:', businessId);
      setIsLoading(false);
    }
  }, [businessId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#f97316'; // orange
    return 'var(--destructive)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
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
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Activity className="size-5" style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>Business Health Score</CardTitle>
              <CardDescription>Analyzing your business metrics...</CardDescription>
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
              <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>Business Health Score</CardTitle>
              <CardDescription>Unable to load health data</CardDescription>
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
              onClick={fetchHealthScore}
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

  if (!healthData) return null;

  return (
    <Card style={{ borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--card)' }}>
      <CardHeader style={{ padding: 'var(--spacing-5)' }}>
        <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-3)' }}>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)', flex: 1, minWidth: 0 }}>
            <div
              className="size-10 flex items-center justify-center flex-shrink-0"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Activity className="size-5" style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                Business Health Score
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-4 cursor-help" style={{ color: 'var(--muted-foreground)' }} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        AI-powered analysis of your business health based on financial, operational, growth, and team metrics
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                {healthData.trend === 'up' && (
                  <span className="inline-flex items-center" style={{ gap: 'var(--spacing-1)', color: 'var(--success)' }}>
                    <TrendingUp className="size-3" />
                    Improving
                  </span>
                )}
                {healthData.trend === 'down' && (
                  <span className="inline-flex items-center" style={{ gap: 'var(--spacing-1)', color: 'var(--destructive)' }}>
                    <TrendingDown className="size-3" />
                    Declining
                  </span>
                )}
                {healthData.trend === 'stable' && (
                  <span style={{ color: 'var(--muted-foreground)' }}>Stable</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHealthScore}
            className="size-8 p-0 flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0 }}>
        {/* Overall Score */}
        <div className="text-center" style={{ marginBottom: 'var(--spacing-5)' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="inline-flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(healthData.overallScore)} ${healthData.overallScore * 3.6}deg, var(--muted) 0deg)`,
              position: 'relative',
              marginBottom: 'var(--spacing-3)'
            }}
          >
            <div
              className="flex flex-col items-center justify-center"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--card)',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: getScoreColor(healthData.overallScore) }}>
                {healthData.overallScore}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                out of 100
              </div>
            </div>
          </motion.div>
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${getScoreColor(healthData.overallScore)}20`,
              color: getScoreColor(healthData.overallScore),
              border: `1px solid ${getScoreColor(healthData.overallScore)}40`
            }}
          >
            {getScoreLabel(healthData.overallScore)}
          </Badge>
        </div>

        {/* Metric Breakdown */}
        <div className="space-y-3" style={{ marginBottom: 'var(--spacing-5)' }}>
          <div className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-2)' }}>
            Health Breakdown
          </div>
          {Object.entries(healthData.metrics).map(([key, metric]) => (
            <div key={key}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-1)' }}>
                <span className="text-sm capitalize" style={{ color: 'var(--foreground)' }}>{key}</span>
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{metric.score}%</span>
              </div>
              <Progress value={metric.score} style={{ height: '6px' }} />
            </div>
          ))}
        </div>

        {/* Key Insights */}
        {healthData.insights.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <div className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-2)' }}>
              Key Insights
            </div>
            <ul className="space-y-2">
              {healthData.insights.slice(0, 3).map((insight, index) => (
                <li 
                  key={index} 
                  className="text-sm flex items-start"
                  style={{ gap: 'var(--spacing-2)' }}
                >
                  <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                  <span style={{ color: 'var(--muted-foreground)', flex: 1 }}>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {healthData.recommendations.length > 0 && (
          <div>
            <div className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-2)' }}>
              Recommendations
            </div>
            <ul className="space-y-2">
              {healthData.recommendations.slice(0, 2).map((rec, index) => (
                <li 
                  key={index} 
                  className="text-sm flex items-start"
                  style={{ gap: 'var(--spacing-2)' }}
                >
                  <span style={{ color: 'var(--success)', marginTop: '2px' }}>✓</span>
                  <span style={{ color: 'var(--muted-foreground)', flex: 1 }}>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-center" style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-4)' }}>
          Last updated: {new Date(healthData.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};
