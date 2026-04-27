import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Handshake,
  Plus,
  Import,
  Loader2,
  Edit,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  Building2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UserPlus,
  Flame
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useIsMobile } from '../ui/use-mobile';

interface Deal {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  value: number;
  status: 'pending' | 'closed' | 'waiting for customer' | '30 day escrow' | 'negotiation' | 'lost';
  notes?: string;
  closeDate?: string;
  createdAt: string;
  importedFrom?: 'hot-leads' | 'manual';
}

interface HotLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  value?: number;
  source: string;
  score: number;
  notes?: string;
  createdAt: string;
}

interface DealsTabProps {
  selectedBusiness: any;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

export function DealsTab({ selectedBusiness, onEdit, onDelete }: DealsTabProps) {
  const isMobile = useIsMobile();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoadingHotLeads, setIsLoadingHotLeads] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Create deal dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: '',
    status: 'pending' as Deal['status'],
    notes: '',
    closeDate: ''
  });

  // Load deals
  useEffect(() => {
    loadDeals();
  }, [selectedBusiness?.id]);

  const loadDeals = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals?businessId=${selectedBusiness.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load hot leads for import dialog
  const loadHotLeads = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoadingHotLeads(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/hot-leads?businessId=${selectedBusiness.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHotLeads(data.hotLeads || []);
      }
    } catch (error) {
      console.error('Error loading hot leads:', error);
      toast.error('Failed to load hot leads');
    } finally {
      setIsLoadingHotLeads(false);
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    loadHotLeads();
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === hotLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(hotLeads.map(l => l.id)));
    }
  };

  const handleImportLeads = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select at least one hot lead to import');
      return;
    }

    setIsImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/import-to-deals`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            leadIds: Array.from(selectedLeads)
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Import successful:', result);
        console.log('📊 Imported deals:', result.deals);
        toast.success(`Successfully imported ${selectedLeads.size} lead(s) to deals`);
        setImportDialogOpen(false);
        setSelectedLeads(new Set());
        await loadDeals(); // Force reload
        console.log('📊 Deals reloaded after import');
      } else {
        const error = await response.json();
        console.error('❌ Import failed:', error);
        toast.error(error.message || 'Failed to import leads');
      }
    } catch (error: any) {
      console.error('Error importing leads to deals:', error);
      toast.error(error.message || 'Failed to import leads');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'closed':
        return <CheckCircle2 className="size-4" style={{ color: '#27D17C' }} />;
      case 'pending':
        return <Clock className="size-4" style={{ color: '#f59e0b' }} />;
      case 'waiting for customer':
        return <AlertCircle className="size-4" style={{ color: '#007099' }} />;
      case '30 day escrow':
        return <Calendar className="size-4" style={{ color: '#8b5cf6' }} />;
      case 'negotiation':
        return <Handshake className="size-4" style={{ color: '#f59e0b' }} />;
      case 'lost':
        return <X className="size-4" style={{ color: '#ef4444' }} />;
      default:
        return <Clock className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />;
    }
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'closed':
        return { bg: '#27D17C20', color: '#27D17C' };
      case 'pending':
        return { bg: '#f59e0b20', color: '#f59e0b' };
      case 'waiting for customer':
        return { bg: '#00709920', color: '#007099' };
      case '30 day escrow':
        return { bg: '#8b5cf620', color: '#8b5cf6' };
      case 'negotiation':
        return { bg: '#f59e0b20', color: '#f59e0b' };
      case 'lost':
        return { bg: '#ef444420', color: '#ef4444' };
      default:
        return { bg: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-8)',
        gap: 'var(--spacing-2)'
      }}>
        <Loader2 className="size-5 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
        <span style={{ color: 'var(--color-muted-foreground)' }}>Loading deals...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Header with action buttons */}
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
          <Handshake className="size-5" style={{ color: '#27D17C' }} />
          Deals ({deals.length})
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button
            onClick={handleImportClick}
            variant="outline"
            style={{
              gap: 'var(--spacing-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-foreground)'
            }}
          >
            <Import className="size-4" />
            Import from Hot Leads
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #27D17C, #00b894)',
              color: 'white',
              border: 'none',
              gap: 'var(--spacing-2)'
            }}
          >
            <Plus className="size-4" />
            Create Deal
          </Button>
        </div>
      </div>

      {/* Deals List */}
      {deals.length === 0 ? (
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
            <Handshake className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
              No deals yet
            </h3>
            <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              Create a deal manually or import from your hot leads
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={handleImportClick}
                variant="outline"
                style={{
                  gap: 'var(--spacing-2)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Import className="size-4" />
                Import from Hot Leads
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #27D17C, #00b894)',
                  color: 'white',
                  border: 'none',
                  gap: 'var(--spacing-2)'
                }}
              >
                <Plus className="size-4" />
                Create Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {deals.map((deal, index) => {
            const statusStyle = getStatusColor(deal.status);
            return (
              <motion.div
                key={deal.id}
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
                      gap: 'var(--spacing-4)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                          <h4 style={{ color: 'var(--color-foreground)', margin: 0 }}>{deal.name}</h4>
                          <Badge style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)',
                          }}>
                            {getStatusIcon(deal.status)}
                            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                          </Badge>
                          {deal.importedFrom && (
                            <Badge style={{
                              background: 'var(--color-primary-soft)',
                              color: 'var(--color-primary)',
                              border: 'none',
                              fontSize: '0.75rem',
                            }}>
                              From {deal.importedFrom === 'hot-leads' ? 'Hot Leads' : 'Manual'}
                            </Badge>
                          )}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 'var(--spacing-1)',
                          marginBottom: 'var(--spacing-3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Building2 className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                              {deal.company}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Mail className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                              {deal.email}
                            </span>
                          </div>
                          {deal.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Phone className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {deal.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-4)',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                            <DollarSign className="size-4" style={{ color: '#27D17C' }} />
                            <span style={{ color: 'var(--color-foreground)' }}>
                              ${deal.value.toLocaleString()}
                            </span>
                          </div>
                          {deal.closeDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                              <Calendar className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                Close: {new Date(deal.closeDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {deal.notes && (
                          <p style={{
                            color: 'var(--color-muted-foreground)',
                            fontSize: '0.875rem',
                            marginTop: 'var(--spacing-3)',
                            margin: 0
                          }}>
                            {deal.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async () => {
                            if (!selectedBusiness?.id) {
                              toast.error('No business selected');
                              return;
                            }
                            
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              if (!session?.access_token) {
                                toast.error('Authentication required');
                                return;
                              }

                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/convert-to-account`,
                                {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${session.access_token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    businessId: selectedBusiness.id,
                                    dealId: deal.id
                                  })
                                }
                              );

                              if (response.ok) {
                                toast.success('Converted to account successfully!');
                                // Remove from deals and update status
                                setDeals(prev => prev.map(d => 
                                  d.id === deal.id ? { ...d, status: 'closed' as const } : d
                                ));
                              } else {
                                const error = await response.json();
                                toast.error(error.message || 'Failed to convert to account');
                              }
                            } catch (error: any) {
                              console.error('Error converting to account:', error);
                              toast.error(error.message || 'Failed to convert to account');
                            }
                          }}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #007099, #0099cc)',
                            color: 'white',
                            border: 'none',
                            gap: 'var(--spacing-1)',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            fontSize: '0.875rem',
                          }}
                        >
                          <UserPlus className="size-4" />
                          Convert to Account
                        </Button>
                        <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(deal)}
                            style={{ color: 'var(--color-muted-foreground)' }}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Optimistic update - remove immediately from UI
                              setDeals(prev => prev.filter(d => d.id !== deal.id));
                              // Then call the backend
                              onDelete(deal.id);
                            }}
                            style={{ color: 'var(--color-destructive)' }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Import from Hot Leads Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent 
          style={{
            maxWidth: '800px',
            maxHeight: '80vh',
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-foreground)' }}>
              Import Hot Leads to Deals
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-muted-foreground)' }}>
              Select hot leads from your list to import them as deals.
            </DialogDescription>
          </DialogHeader>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--spacing-4)',
            padding: 'var(--spacing-4) 0'
          }}>
            {/* Selection controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-3)',
              background: 'var(--color-muted)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <Checkbox
                  checked={selectedLeads.size === hotLeads.length && hotLeads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                  Select All ({selectedLeads.size} selected)
                </span>
              </div>
              <Button
                onClick={handleImportLeads}
                disabled={selectedLeads.size === 0 || isImporting}
                style={{
                  background: selectedLeads.size > 0 ? 'linear-gradient(135deg, #27D17C, #00b894)' : 'var(--color-muted)',
                  color: selectedLeads.size > 0 ? 'white' : 'var(--color-muted-foreground)',
                  border: 'none',
                  gap: 'var(--spacing-2)'
                }}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Import className="size-4" />
                    Import {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ''}
                  </>
                )}
              </Button>
            </div>

            {/* Hot leads list */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-2)'
            }}>
              {isLoadingHotLeads ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--spacing-8)',
                  gap: 'var(--spacing-2)'
                }}>
                  <Loader2 className="size-5 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Loading hot leads...</span>
                </div>
              ) : hotLeads.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  color: 'var(--color-muted-foreground)'
                }}>
                  No hot leads available to import
                </div>
              ) : (
                hotLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      background: selectedLeads.has(lead.id) ? 'var(--color-primary-soft)' : 'var(--color-card)',
                      border: `1px solid ${selectedLeads.has(lead.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <span style={{ color: 'var(--color-foreground)' }}>
                          {lead.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                          {lead.company} • {lead.email}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          {lead.value && (
                            <Badge style={{
                              background: 'var(--color-muted)',
                              color: 'var(--color-foreground)',
                              border: 'none',
                              fontSize: '0.75rem',
                            }}>
                              ${lead.value.toLocaleString()}
                            </Badge>
                          )}
                          <Badge style={{
                            background: 'var(--color-muted)',
                            color: 'var(--color-foreground)',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            Score: {lead.score}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Deal Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent 
          className="max-w-2xl"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ 
              color: 'var(--color-foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)'
            }}>
              <Handshake className="size-5" style={{ color: '#27D17C' }} />
              Create Deal
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-muted-foreground)' }}>
              Add a new deal to your business.
            </DialogDescription>
          </DialogHeader>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--spacing-6)',
            padding: 'var(--spacing-4) 0',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}>
            {/* Required fields section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
              padding: 'var(--spacing-4)',
              background: 'var(--color-muted)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-2)'
              }}>
                <DollarSign className="size-5" style={{ color: '#27D17C' }} />
                <h4 style={{ 
                  color: 'var(--color-foreground)', 
                  margin: 0,
                }}>
                  Deal Information
                </h4>
              </div>

              {/* Two column layout for desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 'var(--spacing-4)'
              }}>
                <div className="space-y-2">
                  <Label htmlFor="deal-name">
                    <span style={{ color: 'var(--color-foreground)' }}>Contact Name</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="deal-name"
                    type="text"
                    placeholder="John Doe"
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-company">
                    <span style={{ color: 'var(--color-foreground)' }}>Company</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="deal-company"
                    type="text"
                    placeholder="Acme Corp"
                    value={newDeal.company}
                    onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-email">
                    <span style={{ color: 'var(--color-foreground)' }}>Email</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="deal-email"
                    type="email"
                    placeholder="john@acmecorp.com"
                    value={newDeal.email}
                    onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-status">
                    <span style={{ color: 'var(--color-foreground)' }}>Status</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Select
                    value={newDeal.status}
                    onValueChange={(value) => setNewDeal({ ...newDeal, status: value as Deal['status'] })}
                  >
                    <SelectTrigger id="deal-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="waiting for customer">Waiting for Customer</SelectItem>
                      <SelectItem value="30 day escrow">30 Day Escrow</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Optional fields section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
              padding: 'var(--spacing-4)',
              background: 'var(--color-muted)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-2)'
              }}>
                <Building2 className="size-5" style={{ color: 'var(--color-muted-foreground)' }} />
                <h4 style={{ 
                  color: 'var(--color-foreground)', 
                  margin: 0,
                }}>
                  Additional Details
                </h4>
                <span style={{ 
                  color: 'var(--color-muted-foreground)',
                  fontSize: '0.875rem',
                  marginLeft: 'var(--spacing-1)'
                }}>
                  (Optional)
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 'var(--spacing-4)'
              }}>
                <div className="space-y-2">
                  <Label htmlFor="deal-phone">
                    <Phone className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Phone</span>
                  </Label>
                  <Input
                    id="deal-phone"
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={newDeal.phone}
                    onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-value">
                    <DollarSign className="size-4" style={{ color: '#27D17C' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Deal Value</span>
                  </Label>
                  <Input
                    id="deal-value"
                    type="number"
                    placeholder="50000"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-close-date">
                    <Calendar className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Expected Close Date</span>
                  </Label>
                  <Input
                    id="deal-close-date"
                    type="date"
                    value={newDeal.closeDate}
                    onChange={(e) => setNewDeal({ ...newDeal, closeDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-notes">
                  <span style={{ color: 'var(--color-foreground)' }}>Notes</span>
                </Label>
                <Textarea
                  id="deal-notes"
                  placeholder="Add any additional information about this deal..."
                  rows={4}
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-3)',
              paddingTop: 'var(--spacing-2)'
            }}>
              <Button
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewDeal({
                    name: '',
                    company: '',
                    email: '',
                    phone: '',
                    value: '',
                    status: 'pending',
                    notes: '',
                    closeDate: ''
                  });
                }}
                variant="outline"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedBusiness?.id) {
                    toast.error('No business selected');
                    return;
                  }

                  if (!newDeal.name || !newDeal.company || !newDeal.email) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  
                  setIsCreating(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      toast.error('Authentication required');
                      return;
                    }

                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/create-deal`,
                      {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          businessId: selectedBusiness.id,
                          deal: {
                            name: newDeal.name,
                            company: newDeal.company,
                            email: newDeal.email,
                            phone: newDeal.phone,
                            value: parseFloat(newDeal.value) || 0,
                            status: newDeal.status,
                            notes: newDeal.notes,
                            closeDate: newDeal.closeDate
                          }
                        })
                      }
                    );

                    if (response.ok) {
                      toast.success('Deal created successfully!');
                      setCreateDialogOpen(false);
                      setNewDeal({
                        name: '',
                        company: '',
                        email: '',
                        phone: '',
                        value: '',
                        status: 'pending',
                        notes: '',
                        closeDate: ''
                      });
                      loadDeals();
                    } else {
                      const error = await response.json();
                      toast.error(error.message || 'Failed to create deal');
                    }
                  } catch (error: any) {
                    console.error('Error creating deal:', error);
                    toast.error(error.message || 'Failed to create deal');
                  } finally {
                    setIsCreating(false);
                  }
                }}
                disabled={isCreating || !newDeal.name || !newDeal.company || !newDeal.email}
                style={{
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  background: (isCreating || !newDeal.name || !newDeal.company || !newDeal.email) 
                    ? 'var(--color-muted)' 
                    : 'linear-gradient(135deg, #27D17C, #00b894)',
                  color: (isCreating || !newDeal.name || !newDeal.company || !newDeal.email) 
                    ? 'var(--color-muted-foreground)' 
                    : 'white',
                  border: 'none',
                  gap: 'var(--spacing-2)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating Deal...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Create Deal
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}