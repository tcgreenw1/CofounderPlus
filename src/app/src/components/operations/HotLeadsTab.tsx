import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
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
  TrendingUp,
  Handshake
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useIsMobile } from '../ui/use-mobile';

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
  importedFrom?: 'marketing' | 'manual';
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  score: number;
  status: string;
  createdAt: string;
  temperature?: 'hot' | 'warm' | 'cold';
  notes?: string;
}

interface HotLeadsTabProps {
  selectedBusiness: any;
  onEdit: (lead: HotLead) => void;
  onDelete: (id: string) => void;
}

export function HotLeadsTab({ selectedBusiness, onEdit, onDelete }: HotLeadsTabProps) {
  const isMobile = useIsMobile();
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [marketingLeads, setMarketingLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoadingMarketingLeads, setIsLoadingMarketingLeads] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Create hot lead dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: '',
    source: '',
    notes: '',
  });

  // Load hot leads
  useEffect(() => {
    loadHotLeads();
  }, [selectedBusiness?.id]);

  const loadHotLeads = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Load marketing leads for import dialog
  const loadMarketingLeads = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoadingMarketingLeads(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/leads?businessId=${selectedBusiness.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMarketingLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error loading marketing leads:', error);
      toast.error('Failed to load marketing leads');
    } finally {
      setIsLoadingMarketingLeads(false);
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    loadMarketingLeads();
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
    if (selectedLeads.size === marketingLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(marketingLeads.map(l => l.id)));
    }
  };

  const handleImportLeads = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select at least one lead to import');
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/import-leads`,
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
        toast.success(`Successfully imported ${selectedLeads.size} lead(s)`);
        setImportDialogOpen(false);
        setSelectedLeads(new Set());
        loadHotLeads();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to import leads');
      }
    } catch (error: any) {
      console.error('Error importing leads:', error);
      toast.error(error.message || 'Failed to import leads');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateLead = async () => {
    if (!selectedBusiness?.id) {
      toast.error('No business selected');
      return;
    }

    if (!newLead.name || !newLead.email || !newLead.company || !newLead.source) {
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/hot-leads/create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            hotLead: {
              name: newLead.name,
              company: newLead.company,
              email: newLead.email,
              phone: newLead.phone,
              value: newLead.value ? parseFloat(newLead.value) : undefined,
              source: newLead.source,
              notes: newLead.notes
            }
          })
        }
      );

      if (response.ok) {
        toast.success('Hot lead created successfully');
        setCreateDialogOpen(false);
        setNewLead({
          name: '',
          company: '',
          email: '',
          phone: '',
          value: '',
          source: '',
          notes: '',
        });
        loadHotLeads();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create hot lead');
      }
    } catch (error: any) {
      console.error('Error creating hot lead:', error);
      toast.error(error.message || 'Failed to create hot lead');
    } finally {
      setIsCreating(false);
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
        <span style={{ color: 'var(--color-muted-foreground)' }}>Loading hot leads...</span>
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
          <Flame className="size-5" style={{ color: '#d4183d' }} />
          Hot Leads ({hotLeads.length})
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
            Import from Marketing
          </Button>
          <Button
            onClick={handleCreateClick}
            style={{
              background: 'linear-gradient(135deg, #d4183d, #ff4757)',
              color: 'white',
              border: 'none',
              gap: 'var(--spacing-2)'
            }}
          >
            <Plus className="size-4" />
            Create Hot Lead
          </Button>
        </div>
      </div>

      {/* Hot Leads List */}
      {hotLeads.length === 0 ? (
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
            <Flame className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
              No hot leads yet
            </h3>
            <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              Create a hot lead manually or import from your marketing leads
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
                Import from Marketing
              </Button>
              <Button
                onClick={handleCreateClick}
                style={{
                  background: 'linear-gradient(135deg, #d4183d, #ff4757)',
                  color: 'white',
                  border: 'none',
                  gap: 'var(--spacing-2)'
                }}
              >
                <Plus className="size-4" />
                Create Hot Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {hotLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                        <Flame className="size-4" style={{ color: '#d4183d' }} />
                        <h4 style={{ color: 'var(--color-foreground)', margin: 0 }}>{lead.name}</h4>
                        {lead.importedFrom && (
                          <Badge style={{
                            background: lead.importedFrom === 'marketing' ? 'var(--color-primary-soft)' : 'var(--color-success-soft)',
                            color: lead.importedFrom === 'marketing' ? 'var(--color-primary)' : 'var(--color-success)',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            {lead.importedFrom === 'marketing' ? 'From Marketing' : 'Manual'}
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
                            {lead.company}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <Mail className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                            {lead.email}
                          </span>
                        </div>
                        {lead.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Phone className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                              {lead.phone}
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
                        {lead.value && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                            <DollarSign className="size-4" style={{ color: '#27D17C' }} />
                            <span style={{ color: 'var(--color-foreground)' }}>
                              ${lead.value.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                          <TrendingUp className="size-4" style={{ color: '#f59e0b' }} />
                          <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                            Score: {lead.score}/100
                          </span>
                        </div>
                        <Badge style={{
                          background: 'var(--color-muted)',
                          color: 'var(--color-foreground)',
                          border: 'none',
                          fontSize: '0.75rem',
                        }}>
                          {lead.source}
                        </Badge>
                      </div>

                      {lead.notes && (
                        <p style={{
                          color: 'var(--color-muted-foreground)',
                          fontSize: '0.875rem',
                          marginTop: 'var(--spacing-3)',
                          margin: 0
                        }}>
                          {lead.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          if (!selectedBusiness?.id) return;
                          
                          // Optimistic update - remove from UI immediately
                          setHotLeads(prev => prev.filter(l => l.id !== lead.id));
                          toast.success('Converted to deal!');
                          
                          // Then call backend in background
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session?.access_token) {
                              return;
                            }

                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/convert-to-deal`,
                              {
                                method: 'POST',
                                headers: {
                                  Authorization: `Bearer ${session.access_token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  businessId: selectedBusiness.id,
                                  leadId: lead.id
                                })
                              }
                            );

                            if (response.ok) {
                              const result = await response.json();
                              console.log('✅ Convert to deal successful:', result);
                              console.log('📊 Deal created:', result.deal);
                            } else {
                              const error = await response.json();
                              console.error('❌ Convert to deal failed:', error);
                              toast.error(error.message || 'Failed to convert to deal');
                              // Optionally: restore the lead if backend fails
                            }
                          } catch (error: any) {
                            console.error('Error converting to deal:', error);
                            toast.error(error.message || 'Failed to convert to deal');
                          }
                        }}
                        style={{
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, #27D17C, #00b894)',
                          color: 'white',
                          border: 'none',
                          gap: 'var(--spacing-1)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <Handshake className="size-4" />
                        Convert to Deal
                      </Button>
                      <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(lead)}
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(lead.id)}
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
          ))}
        </div>
      )}

      {/* Import from Marketing Dialog */}
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
              Import Leads from Marketing
            </DialogTitle>
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
                  checked={selectedLeads.size === marketingLeads.length && marketingLeads.length > 0}
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
                  background: selectedLeads.size > 0 ? 'linear-gradient(135deg, #d4183d, #ff4757)' : 'var(--color-muted)',
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

            {/* Marketing leads list */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-2)'
            }}>
              {isLoadingMarketingLeads ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--spacing-8)',
                  gap: 'var(--spacing-2)'
                }}>
                  <Loader2 className="size-5 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Loading marketing leads...</span>
                </div>
              ) : marketingLeads.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  color: 'var(--color-muted-foreground)'
                }}>
                  No marketing leads available to import
                </div>
              ) : (
                marketingLeads.map((lead) => (
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
                        {lead.temperature && (
                          <Badge style={{
                            background: lead.temperature === 'hot' ? '#d4183d20' : lead.temperature === 'warm' ? '#f59e0b20' : '#00709920',
                            color: lead.temperature === 'hot' ? '#d4183d' : lead.temperature === 'warm' ? '#f59e0b' : '#007099',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            {lead.temperature}
                          </Badge>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                          {lead.company} • {lead.email}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <Badge style={{
                            background: 'var(--color-muted)',
                            color: 'var(--color-foreground)',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            Score: {lead.score}
                          </Badge>
                          <Badge style={{
                            background: 'var(--color-muted)',
                            color: 'var(--color-foreground)',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            {lead.source}
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

      {/* Create Hot Lead Dialog */}
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
              <Flame className="size-5" style={{ color: '#d4183d' }} />
              Create Hot Lead
            </DialogTitle>
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
                <DollarSign className="size-5" style={{ color: '#d4183d' }} />
                <h4 style={{ 
                  color: 'var(--color-foreground)', 
                  margin: 0,
                }}>
                  Lead Information
                </h4>
              </div>

              {/* Two column layout for desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 'var(--spacing-4)'
              }}>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <span style={{ color: 'var(--color-foreground)' }}>Name</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">
                    <span style={{ color: 'var(--color-foreground)' }}>Company</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Corp"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <span style={{ color: 'var(--color-foreground)' }}>Email</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@acmecorp.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">
                    <span style={{ color: 'var(--color-foreground)' }}>Source</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="source"
                    type="text"
                    placeholder="Website, Referral, Conference..."
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  />
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
                  <Label htmlFor="phone">
                    <Phone className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Phone</span>
                  </Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    <DollarSign className="size-4" style={{ color: '#27D17C' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Estimated Value</span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="50000"
                    value={newLead.value}
                    onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  <span style={{ color: 'var(--color-foreground)' }}>Notes</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional information about this lead..."
                  rows={4}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-3)',
              justifyContent: 'flex-end',
              paddingTop: 'var(--spacing-2)'
            }}>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLead}
                disabled={isCreating || !newLead.name || !newLead.email || !newLead.company || !newLead.source}
                style={{
                  background: (isCreating || !newLead.name || !newLead.email || !newLead.company || !newLead.source)
                    ? 'var(--color-muted)' 
                    : 'linear-gradient(135deg, #d4183d, #ff4757)',
                  color: (isCreating || !newLead.name || !newLead.email || !newLead.company || !newLead.source)
                    ? 'var(--color-muted-foreground)' 
                    : 'white',
                  border: 'none',
                  gap: 'var(--spacing-2)',
                  minWidth: '160px'
                }}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Create Hot Lead
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