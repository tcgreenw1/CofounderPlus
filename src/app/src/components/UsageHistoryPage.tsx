import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Clock,
  Filter,
  Download,
  Sparkles
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Separator } from './ui/separator';
import { Table } from './ui/table';
import { CreditsDisplay } from './CreditsDisplay';
import { getCreditUsageHistory, getCreditsSummary, CreditUsage, CreditsSummary } from '../utils/creditsApi';
import { useBusiness } from './BusinessContext';
import { useSubscription } from './SubscriptionContext';

interface UsageHistoryPageProps {
  user: any;
}

export const UsageHistoryPage: React.FC<UsageHistoryPageProps> = ({ user }) => {
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([]);
  const [creditsSummary, setCreditsSummary] = useState<CreditsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); // days
  const { selectedBusiness } = useBusiness();
  const { subscription } = useSubscription();

  useEffect(() => {
    loadUsageData();
  }, [selectedBusiness?.id, timeRange]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [history, summary] = await Promise.all([
        getCreditUsageHistory(selectedBusiness?.id, timeRange),
        getCreditsSummary(selectedBusiness?.id)
      ]);
      
      setUsageHistory(history);
      setCreditsSummary(summary);
    } catch (err) {
      console.error('Failed to load usage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupUsageByDay = (usage: CreditUsage[]) => {
    const grouped = usage.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          totalCredits: 0,
          totalTokens: 0,
          totalRequests: 0,
          totalCost: 0,
          items: []
        };
      }
      
      acc[date].totalCredits += Math.ceil(item.tokensUsed / 100);
      acc[date].totalTokens += item.tokensUsed;
      acc[date].totalRequests += item.requestCount;
      acc[date].totalCost += item.estimatedCost;
      acc[date].items.push(item);
      
      return acc;
    }, {} as any);
    
    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const dailyUsage = groupUsageByDay(usageHistory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background starry-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
            <div className="h-32 bg-muted/20 rounded animate-pulse" />
            <div className="h-64 bg-muted/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background starry-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 glass-morphism">
            <h1 className="text-xl font-semibold mb-4">Unable to Load Usage Data</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadUsageData}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background starry-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-600 dark:to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">AI Usage & Credits</h1>
              <p className="text-muted-foreground">
                Track your AI assistant usage and manage your credits
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedBusiness && (
              <Badge variant="outline" className="glass-morphism">
                {selectedBusiness.name}
              </Badge>
            )}
            <Select 
              value={timeRange.toString()} 
              onValueChange={(value) => setTimeRange(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Credits Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CreditsDisplay variant="detailed" />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="p-4 glass-morphism">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Chat Sessions</h3>
              </div>
              <div className="text-2xl font-bold">
                {creditsSummary?.totalRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total conversations
              </p>
            </Card>
            
            <Card className="p-4 glass-morphism">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Estimated Cost</h3>
              </div>
              <div className="text-2xl font-bold text-green-500">
                ${((creditsSummary?.estimatedCostCents || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                OpenAI API costs
              </p>
            </Card>
          </div>
        </div>

        {/* Usage Timeline */}
        <Card className="p-6 glass-morphism">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Usage Timeline</h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          {dailyUsage.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Usage Yet</h3>
              <p className="text-sm">
                Start a conversation with your AI assistant to see usage data here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyUsage.map((day: any, index: number) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div>
                        <div className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.totalRequests} request{day.totalRequests !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-medium">{day.totalCredits} credits</div>
                        <div className="text-xs text-muted-foreground">
                          {day.totalTokens.toLocaleString()} tokens
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">
                          ${(day.totalCost / 100).toFixed(3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          estimated
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Detailed Usage Table */}
        {usageHistory.length > 0 && (
          <Card className="p-6 glass-morphism">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Detailed Usage Log</h2>
              <Badge variant="outline">
                {usageHistory.length} record{usageHistory.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-border/50">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Feature</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Credits</th>
                    <th className="px-4 py-3 font-medium">Tokens</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.slice(0, 50).map((usage, index) => (
                    <tr 
                      key={usage.id}
                      className="border-t border-border/30 hover:bg-muted/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        {formatDate(usage.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {usage.feature.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {usage.model}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {Math.ceil(usage.tokensUsed / 100)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {usage.tokensUsed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        ${(usage.estimatedCost / 100).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {usageHistory.length > 50 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing first 50 records. Export for complete history.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Subscription Upgrade CTA */}
        {creditsSummary?.subscriptionLimits.overage && (
          <Card className="p-6 glass-morphism border-destructive/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Usage Limit Exceeded</h3>
                <p className="text-sm text-muted-foreground">
                  You've exceeded your monthly limit and may incur overage charges.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button variant="outline">
                View Pricing
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UsageHistoryPage;