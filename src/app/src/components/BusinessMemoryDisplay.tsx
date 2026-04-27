import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  MessageSquare,
  Calendar,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { BusinessMemoryEditor } from './BusinessMemoryEditor';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface BusinessMemoryProps {
  businessId: string;
  user: any;
}

interface ConversationNote {
  date: string;
  note: string;
  source: string;
}

interface BusinessMemory {
  businessId: string;
  businessName?: string;
  industry?: string;
  description?: string;
  
  // Business details
  targetMarket?: string;
  customerPersona?: string;
  valueProposition?: string;
  revenueModel?: string;
  competitors?: string[];
  
  // Goals and challenges
  shortTermGoals?: string[];
  longTermGoals?: string[];
  currentChallenges?: string[];
  
  // Progress tracking
  keyMetrics?: Record<string, any>;
  
  // Conversation insights
  conversationNotes?: ConversationNote[];
  
  lastUpdated?: string;
}

export function BusinessMemoryDisplay({ businessId, user }: BusinessMemoryProps) {
  const [memory, setMemory] = useState<BusinessMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMemory = async () => {
    if (!businessId || !user) return;

    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/business-memory/${businessId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMemory(data);
      } else {
        console.error('Failed to load business memory:', await response.text());
      }
    } catch (error) {
      console.error('Error loading business memory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
  }, [businessId, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMemory();
    setRefreshing(false);
    toast.success('Business memory refreshed');
  };

  const handleSave = async (updatedMemory: Partial<BusinessMemory>) => {
    if (!businessId || !user) return;

    try {
      setSaving(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/business-memory/${businessId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedMemory),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMemory(data.memory);
        setIsEditing(false);
        toast.success('Business memory updated successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to update business memory:', errorText);
        toast.error('Failed to update business memory');
      }
    } catch (error) {
      console.error('Error updating business memory:', error);
      toast.error('Error updating business memory');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      chat: 'var(--primary, #2F80FF)',
      hr: 'var(--destructive, #ef4444)',
      finance: 'var(--warning, #f59e0b)',
      marketing: 'var(--success, #10b981)',
      sales: 'var(--info, #3b82f6)',
      product: 'var(--purple, #8b5cf6)'
    };
    return colors[source] || 'var(--muted-foreground, #64748b)';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Business Memory</CardTitle>
          </div>
          <CardDescription>Loading insights from conversations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasAnyData = memory && (
    memory.targetMarket ||
    memory.customerPersona ||
    memory.valueProposition ||
    memory.revenueModel ||
    (memory.competitors && memory.competitors.length > 0) ||
    (memory.shortTermGoals && memory.shortTermGoals.length > 0) ||
    (memory.longTermGoals && memory.longTermGoals.length > 0) ||
    (memory.currentChallenges && memory.currentChallenges.length > 0) ||
    (memory.conversationNotes && memory.conversationNotes.length > 0)
  );

  // Show editor if in edit mode (even if memory is null - initialize it)
  if (isEditing) {
    const initialMemory = memory || {
      businessId,
      conversationNotes: [],
    };
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Edit Business Memory</CardTitle>
          </div>
          <CardDescription>Manually add or update information about your business</CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessMemoryEditor
            memory={initialMemory}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            loading={saving}
          />
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
              <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Business Memory</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="size-4 mr-2" />
                Add Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>Cofounder learns about your business from conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="size-12 mb-4" style={{ color: 'var(--muted-foreground, #94a3b8)' }} />
            <p style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              No insights yet
            </p>
            <p className="mt-2" style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--muted-foreground, #64748b)' }}>
              Chat with Cofounder about your business or manually add information to build your memory bank
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Business Memory</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="size-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          Insights learned from {memory?.conversationNotes?.length || 0} conversations
          {memory?.lastUpdated && ` • Last updated ${formatDate(memory.lastUpdated)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Details */}
        {(memory?.targetMarket || memory?.customerPersona || memory?.valueProposition || memory?.revenueModel) && (
          <div>
            <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              <Target className="size-4" />
              Business Details
            </h3>
            <div className="space-y-2">
              {memory.targetMarket && (
                <div className="rounded-lg p-3" style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Market
                  </p>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)', marginTop: '4px' }}>
                    {memory.targetMarket}
                  </p>
                </div>
              )}
              {memory.customerPersona && (
                <div className="rounded-lg p-3" style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer Persona
                  </p>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)', marginTop: '4px' }}>
                    {memory.customerPersona}
                  </p>
                </div>
              )}
              {memory.valueProposition && (
                <div className="rounded-lg p-3" style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Value Proposition
                  </p>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)', marginTop: '4px' }}>
                    {memory.valueProposition}
                  </p>
                </div>
              )}
              {memory.revenueModel && (
                <div className="rounded-lg p-3" style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Revenue Model
                  </p>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)', marginTop: '4px' }}>
                    {memory.revenueModel}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competitors */}
        {memory?.competitors && memory.competitors.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              <TrendingUp className="size-4" />
              Competitors
            </h3>
            <div className="flex flex-wrap gap-2">
              {memory.competitors.map((competitor, idx) => (
                <Badge key={idx} variant="outline">
                  {competitor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {((memory?.shortTermGoals && memory.shortTermGoals.length > 0) || 
          (memory?.longTermGoals && memory.longTermGoals.length > 0)) && (
          <div>
            <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              <Target className="size-4" />
              Goals
            </h3>
            <div className="space-y-3">
              {memory.shortTermGoals && memory.shortTermGoals.length > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Short-term (3-6 months)
                  </p>
                  <ul className="space-y-1">
                    {memory.shortTermGoals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-2" style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                        <span style={{ color: 'var(--primary, #2F80FF)' }}>•</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {memory.longTermGoals && memory.longTermGoals.length > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--text-xs, 12px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--muted-foreground, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Long-term (1-3 years)
                  </p>
                  <ul className="space-y-1">
                    {memory.longTermGoals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-2" style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                        <span style={{ color: 'var(--success, #10b981)' }}>•</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges */}
        {memory?.currentChallenges && memory.currentChallenges.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              <AlertCircle className="size-4" />
              Current Challenges
            </h3>
            <ul className="space-y-1">
              {memory.currentChallenges.map((challenge, idx) => (
                <li key={idx} className="flex items-start gap-2" style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                  <span style={{ color: 'var(--warning, #f59e0b)' }}>•</span>
                  {challenge}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conversation Notes */}
        {memory?.conversationNotes && memory.conversationNotes.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'var(--font-semibold, 600)', color: 'var(--foreground, #1e293b)' }}>
              <MessageSquare className="size-4" />
              Recent Insights
            </h3>
            <div className="space-y-2">
              {memory.conversationNotes.slice(-5).reverse().map((note, idx) => (
                <div key={idx} className="rounded-lg p-3" style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: getSourceBadgeColor(note.source),
                        color: getSourceBadgeColor(note.source)
                      }}
                    >
                      {note.source}
                    </Badge>
                    <span style={{ fontSize: 'var(--text-xs, 12px)', color: 'var(--muted-foreground, #64748b)' }}>
                      {formatDate(note.date)}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
