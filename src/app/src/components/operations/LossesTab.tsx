import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  XCircle,
  TrendingDown,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Tag,
  Filter,
  RotateCcw,
  Lightbulb,
  Target,
  Users,
  Download
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useIsMobile } from '../ui/use-mobile';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface LostOpportunity {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  value?: number;
  stage: 'marketing lead' | 'hot lead' | 'deal' | 'account';
  lostReason: 'price too high' | 'competitor' | 'timing' | 'budget cuts' | 'no response' | 'product fit' | 'other';
  lostDate: string;
  notes?: string;
  winBackStrategy?: string;
  competitorName?: string;
  followUpDate?: string;
  createdAt: string;
}

interface LossesTabProps {
  selectedBusiness: any;
  user?: any;
  onEdit: (loss: LostOpportunity) => void;
  onDelete: (id: string) => void;
}

export function LossesTab({ selectedBusiness, user, onEdit, onDelete }: LossesTabProps) {
  const isMobile = useIsMobile();
  const [losses, setLosses] = useState<LostOpportunity[]>([]);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding loss
  const [newLoss, setNewLoss] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: '',
    stage: 'marketing lead' as LostOpportunity['stage'],
    lostReason: 'price too high' as LostOpportunity['lostReason'],
    lostDate: new Date().toISOString().split('T')[0],
    notes: '',
    winBackStrategy: '',
    competitorName: '',
    followUpDate: ''
  });

  // Import state
  const [importSource, setImportSource] = useState<'marketing lead' | 'hot lead' | 'deal' | 'account'>('hot lead');
  const [importData, setImportData] = useState({
    lostReason: 'price too high' as LostOpportunity['lostReason'],
    lostDate: new Date().toISOString().split('T')[0],
    notes: '',
    winBackStrategy: '',
    competitorName: '',
    followUpDate: ''
  });
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Load losses from backend
  const loadLosses = async () => {
    if (!selectedBusiness?.id) return;

    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/losses?businessId=${selectedBusiness.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLosses(result.losses || []);
      } else {
        console.error('Failed to load losses');
      }
    } catch (error) {
      console.error('Error loading losses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load available items for import
  const loadAvailableItems = async (source: string) => {
    if (!selectedBusiness?.id) return;

    try {
      setIsLoadingItems(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      let endpoint = '';
      if (source === 'hot lead') {
        endpoint = 'hot-leads';
      } else if (source === 'deal') {
        endpoint = 'deals';
      } else if (source === 'account') {
        endpoint = 'accounts';
      } else {
        endpoint = 'marketing-leads';
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/${endpoint}?businessId=${selectedBusiness.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const items = result.hotLeads || result.deals || result.accounts || result.leads || [];
        setAvailableItems(items);
      } else {
        setAvailableItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setAvailableItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Load data on mount and when business changes
  useEffect(() => {
    loadLosses();
  }, [selectedBusiness?.id]);

  // Handle add loss manually
  const handleAddLoss = async () => {
    if (!selectedBusiness?.id) return;
    if (!newLoss.name || !newLoss.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/losses/create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            loss: {
              ...newLoss,
              value: newLoss.value ? parseFloat(newLoss.value) : 0
            }
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success('Loss added successfully');
        setLosses(prev => [...prev, result.loss]);
        setShowAddDialog(false);
        // Reset form
        setNewLoss({
          name: '',
          company: '',
          email: '',
          phone: '',
          value: '',
          stage: 'marketing lead',
          lostReason: 'price too high',
          lostDate: new Date().toISOString().split('T')[0],
          notes: '',
          winBackStrategy: '',
          competitorName: '',
          followUpDate: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add loss');
      }
    } catch (error: any) {
      console.error('Error adding loss:', error);
      toast.error('Failed to add loss');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle import losses
  const handleImportLosses = async () => {
    if (!selectedBusiness?.id) return;
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/losses/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            sourceStage: importSource,
            itemIds: selectedItems,
            ...importData
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setLosses(prev => [...prev, ...result.losses]);
        setShowImportDialog(false);
        setSelectedItems([]);
        setAvailableItems([]);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to import losses');
      }
    } catch (error: any) {
      console.error('Error importing losses:', error);
      toast.error('Failed to import losses');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete loss
  const handleDeleteLoss = async (lossId: string) => {
    if (!selectedBusiness?.id) return;

    // Optimistic update
    setLosses(prev => prev.filter(l => l.id !== lossId));
    toast.success('Loss deleted');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/losses/${lossId}?businessId=${selectedBusiness.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete loss:', error);
        toast.error('Failed to delete loss');
        // Reload to restore state
        loadLosses();
      }
    } catch (error: any) {
      console.error('Error deleting loss:', error);
      toast.error('Failed to delete loss');
      loadLosses();
    }
  };

  const getStageColor = (stage: LostOpportunity['stage']) => {
    switch (stage) {
      case 'marketing lead':
        return { bg: '#007099' + '20', color: '#007099' };
      case 'hot lead':
        return { bg: '#f59e0b' + '20', color: '#f59e0b' };
      case 'deal':
        return { bg: '#27D17C' + '20', color: '#27D17C' };
      case 'account':
        return { bg: '#8b5cf6' + '20', color: '#8b5cf6' };
      default:
        return { bg: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
    }
  };

  const getReasonIcon = (reason: LostOpportunity['lostReason']) => {
    switch (reason) {
      case 'price too high':
        return <DollarSign className="size-4" style={{ color: '#ef4444' }} />;
      case 'competitor':
        return <Target className="size-4" style={{ color: '#f59e0b' }} />;
      case 'timing':
        return <Calendar className="size-4" style={{ color: '#007099' }} />;
      case 'budget cuts':
        return <TrendingDown className="size-4" style={{ color: '#ef4444' }} />;
      case 'no response':
        return <AlertTriangle className="size-4" style={{ color: '#94a3b8' }} />;
      case 'product fit':
        return <Tag className="size-4" style={{ color: '#64748b' }} />;
      default:
        return <XCircle className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />;
    }
  };

  const getReasonColor = (reason: LostOpportunity['lostReason']) => {
    switch (reason) {
      case 'price too high':
        return { bg: '#ef4444' + '20', color: '#ef4444' };
      case 'competitor':
        return { bg: '#f59e0b' + '20', color: '#f59e0b' };
      case 'timing':
        return { bg: '#007099' + '20', color: '#007099' };
      case 'budget cuts':
        return { bg: '#ef4444' + '20', color: '#ef4444' };
      case 'no response':
        return { bg: '#94a3b8' + '20', color: '#94a3b8' };
      case 'product fit':
        return { bg: '#64748b' + '20', color: '#64748b' };
      default:
        return { bg: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
    }
  };

  const filteredLosses = losses.filter(loss => {
    const matchesStage = stageFilter === 'all' || loss.stage === stageFilter;
    const matchesReason = reasonFilter === 'all' || loss.lostReason === reasonFilter;
    return matchesStage && matchesReason;
  });

  const totalLostValue = filteredLosses.reduce((sum, loss) => sum + (loss.value || 0), 0);
  const lossesWithFollowUp = filteredLosses.filter(l => l.followUpDate).length;
  const lossesWithWinBack = filteredLosses.filter(l => l.winBackStrategy).length;

  // Group by reason for insights
  const lossesByReason = losses.reduce((acc, loss) => {
    acc[loss.lostReason] = (acc[loss.lostReason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLostReason = Object.entries(lossesByReason).sort((a, b) => b[1] - a[1])[0];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-12)' }}>
        <Loader2 className="size-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 'var(--spacing-3)'
      }}>
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <XCircle className="size-5" style={{ color: '#ef4444' }} />
              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Total Losses</span>
            </div>
            <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
              {filteredLosses.length}
            </div>
          </CardContent>
        </Card>

        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <TrendingDown className="size-5" style={{ color: '#ef4444' }} />
              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Lost Value</span>
            </div>
            <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
              ${(totalLostValue / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>

        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <RotateCcw className="size-5" style={{ color: '#27D17C' }} />
              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Win-Back Plans</span>
            </div>
            <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
              {lossesWithWinBack}
            </div>
          </CardContent>
        </Card>

        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Calendar className="size-5" style={{ color: '#007099' }} />
              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Follow-ups Scheduled</span>
            </div>
            <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
              {lossesWithFollowUp}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      {topLostReason && (
        <Card style={{
          background: 'linear-gradient(135deg, #ef4444' + '10, #f59e0b' + '10)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
              <Lightbulb className="size-6" style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <h4 style={{ color: 'var(--color-foreground)', margin: 0, marginBottom: 'var(--spacing-1)' }}>
                  Key Insight
                </h4>
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                  Your top loss reason is <strong style={{ color: 'var(--color-foreground)' }}>"{topLostReason[0]}"</strong> ({topLostReason[1]} occurrences).
                  Consider addressing this pattern to improve your win rate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-3)',
        flexWrap: 'wrap'
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--color-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)'
        }}>
          <XCircle className="size-5" style={{ color: '#ef4444' }} />
          Lost Opportunities ({filteredLosses.length})
        </h3>

        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button
            onClick={() => setShowImportDialog(true)}
            size="sm"
            variant="outline"
            style={{
              gap: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Download className="size-4" />
            Import from Accounts
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            style={{
              gap: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none'
            }}
          >
            <Plus className="size-4" />
            Add Loss
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-4)',
        background: 'var(--color-muted)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Filter className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
          <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem', fontWeight: 600 }}>
            Filter by:
          </span>
        </div>
        
        {/* Stage Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem' }}>Stage</span>
          <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
            <Button
              variant={stageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter('all')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: stageFilter === 'all' ? 'none' : '1px solid var(--color-border)',
                background: stageFilter === 'all' ? 'var(--color-primary)' : 'transparent',
                color: stageFilter === 'all' ? 'white' : 'var(--color-foreground)'
              }}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageFilter('marketing lead')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: stageFilter === 'marketing lead' ? 'none' : '1px solid var(--color-border)',
                background: stageFilter === 'marketing lead' ? '#007099' : 'transparent',
                color: stageFilter === 'marketing lead' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Marketing Lead
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageFilter('hot lead')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: stageFilter === 'hot lead' ? 'none' : '1px solid var(--color-border)',
                background: stageFilter === 'hot lead' ? '#f59e0b' : 'transparent',
                color: stageFilter === 'hot lead' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Hot Lead
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageFilter('deal')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: stageFilter === 'deal' ? 'none' : '1px solid var(--color-border)',
                background: stageFilter === 'deal' ? '#27D17C' : 'transparent',
                color: stageFilter === 'deal' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Deal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageFilter('account')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: stageFilter === 'account' ? 'none' : '1px solid var(--color-border)',
                background: stageFilter === 'account' ? '#8b5cf6' : 'transparent',
                color: stageFilter === 'account' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Account
            </Button>
          </div>
        </div>

        {/* Reason Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem' }}>Lost Reason</span>
          <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
            <Button
              variant={reasonFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReasonFilter('all')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'all' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'all' ? 'var(--color-primary)' : 'transparent',
                color: reasonFilter === 'all' ? 'white' : 'var(--color-foreground)'
              }}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonFilter('price too high')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'price too high' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'price too high' ? '#ef4444' : 'transparent',
                color: reasonFilter === 'price too high' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Price
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonFilter('competitor')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'competitor' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'competitor' ? '#f59e0b' : 'transparent',
                color: reasonFilter === 'competitor' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Competitor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonFilter('timing')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'timing' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'timing' ? '#007099' : 'transparent',
                color: reasonFilter === 'timing' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Timing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonFilter('budget cuts')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'budget cuts' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'budget cuts' ? '#ef4444' : 'transparent',
                color: reasonFilter === 'budget cuts' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Budget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonFilter('no response')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: reasonFilter === 'no response' ? 'none' : '1px solid var(--color-border)',
                background: reasonFilter === 'no response' ? '#94a3b8' : 'transparent',
                color: reasonFilter === 'no response' ? 'white' : 'var(--color-foreground)'
              }}
            >
              No Response
            </Button>
          </div>
        </div>
      </div>

      {/* Losses List */}
      {filteredLosses.length === 0 ? (
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
            <XCircle className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
              No losses found
            </h3>
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              {stageFilter !== 'all' || reasonFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Track lost opportunities to learn and improve'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {filteredLosses.map((loss, index) => {
            const stageStyle = getStageColor(loss.stage);
            const reasonStyle = getReasonColor(loss.lostReason);
            const isUpcoming = loss.followUpDate && new Date(loss.followUpDate) > new Date();
            
            return (
              <motion.div
                key={loss.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <CardContent style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 'var(--spacing-4)',
                      flexWrap: isMobile ? 'wrap' : 'nowrap'
                    }}>
                      <div style={{ flex: 1, minWidth: isMobile ? '100%' : '0' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                          <h4 style={{ color: 'var(--color-foreground)', margin: 0 }}>{loss.name}</h4>
                          <Badge style={{
                            background: stageStyle.bg,
                            color: stageStyle.color,
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            {loss.stage.charAt(0).toUpperCase() + loss.stage.slice(1)}
                          </Badge>
                          <Badge style={{
                            background: reasonStyle.bg,
                            color: reasonStyle.color,
                            border: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)',
                          }}>
                            {getReasonIcon(loss.lostReason)}
                            {loss.lostReason.charAt(0).toUpperCase() + loss.lostReason.slice(1)}
                          </Badge>
                          {isUpcoming && (
                            <Badge style={{
                              background: '#27D17C' + '20',
                              color: '#27D17C',
                              border: 'none',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-1)',
                            }}>
                              <Calendar className="size-3" />
                              Follow-up scheduled
                            </Badge>
                          )}
                        </div>
                        
                        {/* Contact Info */}
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                          gap: 'var(--spacing-2)',
                          marginBottom: 'var(--spacing-3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Building2 className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                              {loss.company}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Mail className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                              {loss.email}
                            </span>
                          </div>
                          {loss.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Phone className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {loss.phone}
                              </span>
                            </div>
                          )}
                          {loss.value && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <DollarSign className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem', fontWeight: 600 }}>
                                ${loss.value.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Additional Details */}
                        {loss.notes && (
                          <div style={{ 
                            padding: 'var(--spacing-3)',
                            background: 'var(--color-muted)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                              <FileText className="size-4" style={{ color: 'var(--color-muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
                              <p style={{ margin: 0, color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {loss.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {loss.winBackStrategy && (
                          <div style={{ 
                            padding: 'var(--spacing-3)',
                            background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.1), rgba(39, 209, 124, 0.05))',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(39, 209, 124, 0.2)',
                            marginBottom: 'var(--spacing-2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                              <RotateCcw className="size-4" style={{ color: '#27D17C', flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#27D17C', marginBottom: 'var(--spacing-1)' }}>
                                  Win-Back Strategy
                                </div>
                                <p style={{ margin: 0, color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                                  {loss.winBackStrategy}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div style={{ 
                          display: 'flex',
                          gap: 'var(--spacing-4)',
                          flexWrap: 'wrap',
                          fontSize: '0.75rem',
                          color: 'var(--color-muted-foreground)'
                        }}>
                          <div>Lost: {new Date(loss.lostDate).toLocaleDateString()}</div>
                          {loss.followUpDate && (
                            <div>Follow-up: {new Date(loss.followUpDate).toLocaleDateString()}</div>
                          )}
                          {loss.competitorName && (
                            <div>Competitor: {loss.competitorName}</div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexShrink: 0 }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(loss)}
                          style={{
                            gap: 'var(--spacing-1)',
                            color: 'var(--color-muted-foreground)'
                          }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLoss(loss.id)}
                          style={{
                            gap: 'var(--spacing-1)',
                            color: '#ef4444'
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Loss Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>Add Lost Opportunity</DialogTitle>
            <DialogDescription>
              Manually track a lost opportunity to analyze patterns and plan win-back strategies.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLoss.name}
                  onChange={(e) => setNewLoss({ ...newLoss, name: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={newLoss.company}
                  onChange={(e) => setNewLoss({ ...newLoss, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLoss.email}
                  onChange={(e) => setNewLoss({ ...newLoss, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newLoss.phone}
                  onChange={(e) => setNewLoss({ ...newLoss, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  value={newLoss.value}
                  onChange={(e) => setNewLoss({ ...newLoss, value: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  value={newLoss.stage}
                  onChange={(e) => setNewLoss({ ...newLoss, stage: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-foreground)'
                  }}
                >
                  <option value="marketing lead">Marketing Lead</option>
                  <option value="hot lead">Hot Lead</option>
                  <option value="deal">Deal</option>
                  <option value="account">Account</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="lostReason">Lost Reason</Label>
                <select
                  id="lostReason"
                  value={newLoss.lostReason}
                  onChange={(e) => setNewLoss({ ...newLoss, lostReason: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-foreground)'
                  }}
                >
                  <option value="price too high">Price Too High</option>
                  <option value="competitor">Competitor</option>
                  <option value="timing">Timing</option>
                  <option value="budget cuts">Budget Cuts</option>
                  <option value="no response">No Response</option>
                  <option value="product fit">Product Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="lostDate">Lost Date</Label>
                <Input
                  id="lostDate"
                  type="date"
                  value={newLoss.lostDate}
                  onChange={(e) => setNewLoss({ ...newLoss, lostDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="competitorName">Competitor Name (if applicable)</Label>
              <Input
                id="competitorName"
                value={newLoss.competitorName}
                onChange={(e) => setNewLoss({ ...newLoss, competitorName: e.target.value })}
                placeholder="Competitor name"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newLoss.notes}
                onChange={(e) => setNewLoss({ ...newLoss, notes: e.target.value })}
                placeholder="What happened? Why did we lose this opportunity?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="winBackStrategy">Win-Back Strategy</Label>
              <Textarea
                id="winBackStrategy"
                value={newLoss.winBackStrategy}
                onChange={(e) => setNewLoss({ ...newLoss, winBackStrategy: e.target.value })}
                placeholder="How can we win this customer back?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="followUpDate">Follow-Up Date (optional)</Label>
              <Input
                id="followUpDate"
                type="date"
                value={newLoss.followUpDate}
                onChange={(e) => setNewLoss({ ...newLoss, followUpDate: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddLoss} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Loss'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from Accounts Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open);
        if (open) {
          loadAvailableItems(importSource);
        }
      }}>
        <DialogContent style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>Import Lost Opportunities</DialogTitle>
            <DialogDescription>
              Select items from your pipeline to mark as lost opportunities.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            <div>
              <Label htmlFor="importSource">Import From</Label>
              <select
                id="importSource"
                value={importSource}
                onChange={(e) => {
                  const newSource = e.target.value as any;
                  setImportSource(newSource);
                  setSelectedItems([]);
                  loadAvailableItems(newSource);
                }}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-background)',
                  color: 'var(--color-foreground)'
                }}
              >
                <option value="marketing lead">Marketing Leads</option>
                <option value="hot lead">Hot Leads</option>
                <option value="deal">Deals</option>
                <option value="account">Accounts</option>
              </select>
            </div>

            {/* Loss Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="importLostReason">Lost Reason</Label>
                <select
                  id="importLostReason"
                  value={importData.lostReason}
                  onChange={(e) => setImportData({ ...importData, lostReason: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-foreground)'
                  }}
                >
                  <option value="price too high">Price Too High</option>
                  <option value="competitor">Competitor</option>
                  <option value="timing">Timing</option>
                  <option value="budget cuts">Budget Cuts</option>
                  <option value="no response">No Response</option>
                  <option value="product fit">Product Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="importLostDate">Lost Date</Label>
                <Input
                  id="importLostDate"
                  type="date"
                  value={importData.lostDate}
                  onChange={(e) => setImportData({ ...importData, lostDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="importNotes">Notes</Label>
              <Textarea
                id="importNotes"
                value={importData.notes}
                onChange={(e) => setImportData({ ...importData, notes: e.target.value })}
                placeholder="What happened?"
                rows={2}
              />
            </div>

            {/* Available Items */}
            <div>
              <Label>Select Items ({selectedItems.length} selected)</Label>
              {isLoadingItems ? (
                <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                  <Loader2 className="size-6 animate-spin mx-auto" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : availableItems.length === 0 ? (
                <div style={{ 
                  padding: 'var(--spacing-4)',
                  background: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                    No {importSource}s available
                  </p>
                </div>
              ) : (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-2)'
                }}>
                  {availableItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: selectedItems.includes(item.id) ? 'var(--color-primary)' + '10' : 'transparent'
                      }}
                      onClick={() => {
                        if (selectedItems.includes(item.id)) {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        } else {
                          setSelectedItems([...selectedItems, item.id]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                          {item.name || item.contactName || 'Unknown'}
                        </div>
                        <div style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem' }}>
                          {item.company || item.companyName || item.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleImportLosses} disabled={isSubmitting || selectedItems.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
