import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Plus,
  Import,
  Loader2,
  Edit,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  Globe,
  X,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Star,
  MapPin,
  Briefcase,
  CreditCard,
  FileText,
  Activity
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

interface Account {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  accountValue: number;
  status: 'current customer' | 'inactive' | 'at risk' | 'vip' | 'churned';
  accountManager?: string;
  contractStart?: string;
  contractEnd?: string;
  renewalDate?: string;
  notes?: string;
  address?: string;
  employees?: number;
  lifetimeValue?: number;
  lastContact?: string;
  createdAt: string;
  importedFrom?: 'deals' | 'manual';
}

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
}

interface AccountsTabProps {
  selectedBusiness: any;
  user?: any;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountsTab({ selectedBusiness, user, onEdit, onDelete }: AccountsTabProps) {
  const isMobile = useIsMobile();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Create account dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    accountValue: '',
    status: 'current customer' as Account['status'],
    accountManager: '',
    contractStart: '',
    contractEnd: '',
    renewalDate: '',
    notes: '',
    address: '',
    employees: '',
    lifetimeValue: ''
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load accounts
  useEffect(() => {
    loadAccounts();
  }, [selectedBusiness?.id]);

  const loadAccounts = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/accounts?businessId=${selectedBusiness.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load deals for import dialog
  const loadDeals = async () => {
    if (!selectedBusiness?.id) return;
    
    setIsLoadingDeals(true);
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
        // Only show closed deals that aren't lost
        const closedDeals = (data.deals || []).filter((d: Deal) => 
          d.status === 'closed' || d.status === '30 day escrow'
        );
        setDeals(closedDeals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    loadDeals();
  };

  const handleSelectDeal = (dealId: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === deals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(deals.map(d => d.id)));
    }
  };

  const handleImportDeals = async () => {
    if (selectedDeals.size === 0) {
      toast.error('Please select at least one deal to import');
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/import-to-accounts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            dealIds: Array.from(selectedDeals)
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Import deals to accounts successful:', result);
        toast.success(`Successfully imported ${selectedDeals.size} deal(s) to accounts`);
        setImportDialogOpen(false);
        setSelectedDeals(new Set());
        await loadAccounts();
        console.log('📊 Accounts reloaded after import');
      } else {
        const error = await response.json();
        console.error('❌ Import deals to accounts failed:', error);
        toast.error(error.message || 'Failed to import deals');
      }
    } catch (error: any) {
      console.error('Error importing deals to accounts:', error);
      toast.error(error.message || 'Failed to import deals');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedBusiness?.id) {
      toast.error('No business selected');
      return;
    }

    if (!newAccount.name || !newAccount.company || !newAccount.email) {
      toast.error('Please fill in all required fields (Name, Company, Email)');
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/create-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            account: {
              name: newAccount.name,
              company: newAccount.company,
              email: newAccount.email,
              phone: newAccount.phone,
              website: newAccount.website,
              industry: newAccount.industry,
              accountValue: parseFloat(newAccount.accountValue) || 0,
              status: newAccount.status,
              accountManager: newAccount.accountManager,
              contractStart: newAccount.contractStart,
              contractEnd: newAccount.contractEnd,
              renewalDate: newAccount.renewalDate,
              notes: newAccount.notes,
              address: newAccount.address,
              employees: parseInt(newAccount.employees) || undefined,
              lifetimeValue: parseFloat(newAccount.lifetimeValue) || undefined
            }
          })
        }
      );

      if (response.ok) {
        toast.success('Account created successfully!');
        setCreateDialogOpen(false);
        setNewAccount({
          name: '',
          company: '',
          email: '',
          phone: '',
          website: '',
          industry: '',
          accountValue: '',
          status: 'current customer',
          accountManager: '',
          contractStart: '',
          contractEnd: '',
          renewalDate: '',
          notes: '',
          address: '',
          employees: '',
          lifetimeValue: ''
        });
        loadAccounts();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: Account['status']) => {
    switch (status) {
      case 'current customer':
        return <CheckCircle2 className="size-4" style={{ color: '#27D17C' }} />;
      case 'vip':
        return <Star className="size-4" style={{ color: '#f59e0b' }} />;
      case 'at risk':
        return <Activity className="size-4" style={{ color: '#ef4444' }} />;
      case 'inactive':
        return <Users className="size-4" style={{ color: '#94a3b8' }} />;
      case 'churned':
        return <X className="size-4" style={{ color: '#64748b' }} />;
      default:
        return <Building2 className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />;
    }
  };

  const getStatusColor = (status: Account['status']) => {
    switch (status) {
      case 'current customer':
        return { bg: '#27D17C20', color: '#27D17C' };
      case 'vip':
        return { bg: '#f59e0b20', color: '#f59e0b' };
      case 'at risk':
        return { bg: '#ef444420', color: '#ef4444' };
      case 'inactive':
        return { bg: '#94a3b820', color: '#94a3b8' };
      case 'churned':
        return { bg: '#64748b20', color: '#64748b' };
      default:
        return { bg: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
    }
  };

  const filteredAccounts = statusFilter === 'all' 
    ? accounts 
    : accounts.filter(a => a.status === statusFilter);

  const totalAccountValue = accounts.reduce((sum, acc) => sum + acc.accountValue, 0);
  const activeAccounts = accounts.filter(a => a.status === 'current customer' || a.status === 'vip').length;

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
        <span style={{ color: 'var(--color-muted-foreground)' }}>Loading accounts...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Stats Overview */}
      {accounts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 'var(--spacing-3)'
        }}>
          <Card style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                <Building2 className="size-5" style={{ color: '#007099' }} />
                <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Total Accounts</span>
              </div>
              <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
                {accounts.length}
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
                <CheckCircle2 className="size-5" style={{ color: '#27D17C' }} />
                <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Active Accounts</span>
              </div>
              <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
                {activeAccounts}
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
                <DollarSign className="size-5" style={{ color: '#27D17C' }} />
                <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>Total Account Value</span>
              </div>
              <div style={{ color: 'var(--color-foreground)', fontSize: '2rem', fontWeight: 600 }}>
                ${totalAccountValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with action buttons and filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-3)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          <h3 style={{
            margin: 0,
            color: 'var(--color-foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            <Building2 className="size-5" style={{ color: '#007099' }} />
            Accounts ({filteredAccounts.length})
          </h3>
          
          {/* Status filters */}
          <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: statusFilter === 'all' ? 'none' : '1px solid var(--color-border)',
                background: statusFilter === 'all' ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === 'all' ? 'white' : 'var(--color-foreground)'
              }}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('current customer')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: statusFilter === 'current customer' ? 'none' : '1px solid var(--color-border)',
                background: statusFilter === 'current customer' ? '#27D17C' : 'transparent',
                color: statusFilter === 'current customer' ? 'white' : 'var(--color-foreground)'
              }}
            >
              Current
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('vip')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: statusFilter === 'vip' ? 'none' : '1px solid var(--color-border)',
                background: statusFilter === 'vip' ? '#f59e0b' : 'transparent',
                color: statusFilter === 'vip' ? 'white' : 'var(--color-foreground)'
              }}
            >
              VIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('at risk')}
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-1) var(--spacing-2)',
                border: statusFilter === 'at risk' ? 'none' : '1px solid var(--color-border)',
                background: statusFilter === 'at risk' ? '#ef4444' : 'transparent',
                color: statusFilter === 'at risk' ? 'white' : 'var(--color-foreground)'
              }}
            >
              At Risk
            </Button>
          </div>
        </div>

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
            {!isMobile && 'Import from Deals'}
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #007099, #0099cc)',
              color: 'white',
              border: 'none',
              gap: 'var(--spacing-2)'
            }}
          >
            <Plus className="size-4" />
            {!isMobile && 'Create Account'}
          </Button>
        </div>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
            <Building2 className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
              {statusFilter === 'all' ? 'No accounts yet' : `No ${statusFilter} accounts`}
            </h3>
            <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              {statusFilter === 'all' 
                ? 'Create an account manually or import from your closed deals'
                : `No accounts with ${statusFilter} status`
              }
            </p>
            {statusFilter === 'all' && (
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
                  Import from Deals
                </Button>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #007099, #0099cc)',
                    color: 'white',
                    border: 'none',
                    gap: 'var(--spacing-2)'
                  }}
                >
                  <Plus className="size-4" />
                  Create Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {filteredAccounts.map((account, index) => {
            const statusStyle = getStatusColor(account.status);
            return (
              <motion.div
                key={account.id}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                          <h4 style={{ color: 'var(--color-foreground)', margin: 0 }}>{account.name}</h4>
                          <Badge style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)',
                          }}>
                            {getStatusIcon(account.status)}
                            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                          </Badge>
                          {account.importedFrom && (
                            <Badge style={{
                              background: 'var(--color-primary-soft)',
                              color: 'var(--color-primary)',
                              border: 'none',
                              fontSize: '0.75rem',
                            }}>
                              From {account.importedFrom === 'deals' ? 'Deals' : 'Manual'}
                            </Badge>
                          )}
                        </div>
                        
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                          gap: 'var(--spacing-2)',
                          marginBottom: 'var(--spacing-3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Building2 className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                              {account.company}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Mail className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                              {account.email}
                            </span>
                          </div>
                          {account.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Phone className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {account.phone}
                              </span>
                            </div>
                          )}
                          {account.website && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Globe className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {account.website}
                              </span>
                            </div>
                          )}
                          {account.industry && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Briefcase className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                {account.industry}
                              </span>
                            </div>
                          )}
                          {account.accountManager && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                              <Users className="size-3" style={{ color: 'var(--color-muted-foreground)' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                AM: {account.accountManager}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-4)',
                          flexWrap: 'wrap',
                          marginBottom: account.notes ? 'var(--spacing-3)' : 0
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                            <DollarSign className="size-4" style={{ color: '#27D17C' }} />
                            <span style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>
                              ${account.accountValue.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem' }}>
                              /year
                            </span>
                          </div>
                          {account.lifetimeValue && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                              <TrendingUp className="size-4" style={{ color: '#007099' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                LTV: ${account.lifetimeValue.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {account.renewalDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                              <Calendar className="size-4" style={{ color: '#f59e0b' }} />
                              <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                                Renewal: {new Date(account.renewalDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {account.notes && (
                          <p style={{
                            color: 'var(--color-muted-foreground)',
                            fontSize: '0.875rem',
                            margin: 0,
                            padding: 'var(--spacing-2)',
                            background: 'var(--color-muted)',
                            borderRadius: 'var(--radius-md)'
                          }}>
                            {account.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(account)}
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(account.id)}
                          style={{ color: 'var(--color-destructive)' }}
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

      {/* Import from Deals Dialog */}
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
              Import Closed Deals to Accounts
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-muted-foreground)' }}>
              Select closed deals from your list to convert them into customer accounts.
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
                  checked={selectedDeals.size === deals.length && deals.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span style={{ color: 'var(--color-foreground)', fontSize: '0.875rem' }}>
                  Select All ({selectedDeals.size} selected)
                </span>
              </div>
              <Button
                onClick={handleImportDeals}
                disabled={selectedDeals.size === 0 || isImporting}
                style={{
                  background: selectedDeals.size > 0 ? 'linear-gradient(135deg, #007099, #0099cc)' : 'var(--color-muted)',
                  color: selectedDeals.size > 0 ? 'white' : 'var(--color-muted-foreground)',
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
                    Import {selectedDeals.size > 0 ? `(${selectedDeals.size})` : ''}
                  </>
                )}
              </Button>
            </div>

            {/* Deals list */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-2)'
            }}>
              {isLoadingDeals ? (
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
              ) : deals.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  color: 'var(--color-muted-foreground)'
                }}>
                  No closed deals available to import
                </div>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => handleSelectDeal(deal.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      background: selectedDeals.has(deal.id) ? 'var(--color-primary-soft)' : 'var(--color-card)',
                      border: `1px solid ${selectedDeals.has(deal.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Checkbox
                      checked={selectedDeals.has(deal.id)}
                      onCheckedChange={() => handleSelectDeal(deal.id)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <span style={{ color: 'var(--color-foreground)' }}>
                          {deal.name}
                        </span>
                        <Badge style={{
                          background: deal.status === 'closed' ? '#27D17C20' : '#8b5cf620',
                          color: deal.status === 'closed' ? '#27D17C' : '#8b5cf6',
                          border: 'none',
                          fontSize: '0.75rem',
                        }}>
                          {deal.status}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                          {deal.company} • {deal.email}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <Badge style={{
                            background: 'var(--color-muted)',
                            color: 'var(--color-foreground)',
                            border: 'none',
                            fontSize: '0.75rem',
                          }}>
                            ${deal.value.toLocaleString()}
                          </Badge>
                          {deal.closeDate && (
                            <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem' }}>
                              Closed: {new Date(deal.closeDate).toLocaleDateString()}
                            </span>
                          )}
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

      {/* Create Account Dialog */}
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
              <Building2 className="size-5" style={{ color: '#007099' }} />
              Create Account
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
                <Users className="size-5" style={{ color: '#007099' }} />
                <h4 style={{ 
                  color: 'var(--color-foreground)', 
                  margin: 0,
                }}>
                  Account Information
                </h4>
              </div>

              {/* Two column layout for desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 'var(--spacing-4)'
              }}>
                <div className="space-y-2">
                  <Label htmlFor="account-name">
                    <span style={{ color: 'var(--color-foreground)' }}>Contact Name</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="account-name"
                    type="text"
                    placeholder="John Doe"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-company">
                    <span style={{ color: 'var(--color-foreground)' }}>Company</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="account-company"
                    type="text"
                    placeholder="Acme Corp"
                    value={newAccount.company}
                    onChange={(e) => setNewAccount({ ...newAccount, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-email">
                    <span style={{ color: 'var(--color-foreground)' }}>Email</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="account-email"
                    type="email"
                    placeholder="john@acmecorp.com"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-status">
                    <span style={{ color: 'var(--color-foreground)' }}>Status</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Select
                    value={newAccount.status}
                    onValueChange={(value) => setNewAccount({ ...newAccount, status: value as Account['status'] })}
                  >
                    <SelectTrigger id="account-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current customer">Current Customer</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="at risk">At Risk</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-value">
                    <span style={{ color: 'var(--color-foreground)' }}>Account Value</span>
                    <span style={{ color: '#d4183d', marginLeft: 'var(--spacing-1)' }}>*</span>
                  </Label>
                  <Input
                    id="account-value"
                    type="number"
                    placeholder="100000"
                    value={newAccount.accountValue}
                    onChange={(e) => setNewAccount({ ...newAccount, accountValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-manager">
                    <span style={{ color: 'var(--color-foreground)' }}>Account Manager</span>
                  </Label>
                  <Input
                    id="account-manager"
                    type="text"
                    placeholder="Jane Smith"
                    value={newAccount.accountManager}
                    onChange={(e) => setNewAccount({ ...newAccount, accountManager: e.target.value })}
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
                <Briefcase className="size-5" style={{ color: 'var(--color-muted-foreground)' }} />
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
                  <Label htmlFor="account-phone">
                    <Phone className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Phone</span>
                  </Label>
                  <Input
                    id="account-phone"
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-website">
                    <Globe className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Website</span>
                  </Label>
                  <Input
                    id="account-website"
                    type="text"
                    placeholder="https://acmecorp.com"
                    value={newAccount.website}
                    onChange={(e) => setNewAccount({ ...newAccount, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-industry">
                    <Briefcase className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Industry</span>
                  </Label>
                  <Input
                    id="account-industry"
                    type="text"
                    placeholder="Technology, Healthcare..."
                    value={newAccount.industry}
                    onChange={(e) => setNewAccount({ ...newAccount, industry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-employees">
                    <Users className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Employees</span>
                  </Label>
                  <Input
                    id="account-employees"
                    type="number"
                    placeholder="250"
                    value={newAccount.employees}
                    onChange={(e) => setNewAccount({ ...newAccount, employees: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-lifetime-value">
                    <TrendingUp className="size-4" style={{ color: '#007099' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Lifetime Value</span>
                  </Label>
                  <Input
                    id="account-lifetime-value"
                    type="number"
                    placeholder="500000"
                    value={newAccount.lifetimeValue}
                    onChange={(e) => setNewAccount({ ...newAccount, lifetimeValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-address">
                    <MapPin className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Address</span>
                  </Label>
                  <Input
                    id="account-address"
                    type="text"
                    placeholder="123 Main St, City, State"
                    value={newAccount.address}
                    onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract-start">
                    <Calendar className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Contract Start</span>
                  </Label>
                  <Input
                    id="contract-start"
                    type="date"
                    value={newAccount.contractStart}
                    onChange={(e) => setNewAccount({ ...newAccount, contractStart: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract-end">
                    <Calendar className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Contract End</span>
                  </Label>
                  <Input
                    id="contract-end"
                    type="date"
                    value={newAccount.contractEnd}
                    onChange={(e) => setNewAccount({ ...newAccount, contractEnd: e.target.value })}
                  />
                </div>

                <div className="space-y-2" style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                  <Label htmlFor="renewal-date">
                    <Calendar className="size-4" style={{ color: '#27D17C' }} />
                    <span style={{ color: 'var(--color-foreground)' }}>Renewal Date</span>
                  </Label>
                  <Input
                    id="renewal-date"
                    type="date"
                    value={newAccount.renewalDate}
                    onChange={(e) => setNewAccount({ ...newAccount, renewalDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-notes">
                  <span style={{ color: 'var(--color-foreground)' }}>Notes</span>
                </Label>
                <Textarea
                  id="account-notes"
                  placeholder="Add any additional information about this account..."
                  rows={4}
                  value={newAccount.notes}
                  onChange={(e) => setNewAccount({ ...newAccount, notes: e.target.value })}
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
                  setNewAccount({
                    name: '',
                    company: '',
                    email: '',
                    phone: '',
                    website: '',
                    industry: '',
                    accountValue: '',
                    status: 'current customer',
                    accountManager: '',
                    contractStart: '',
                    contractEnd: '',
                    renewalDate: '',
                    notes: '',
                    address: '',
                    employees: '',
                    lifetimeValue: ''
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
                onClick={handleCreateAccount}
                disabled={isCreating || !newAccount.name || !newAccount.company || !newAccount.email || !newAccount.accountValue}
                style={{
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  background: (isCreating || !newAccount.name || !newAccount.company || !newAccount.email || !newAccount.accountValue) 
                    ? 'var(--color-muted)' 
                    : 'linear-gradient(135deg, #007099, #0099cc)',
                  color: (isCreating || !newAccount.name || !newAccount.company || !newAccount.email || !newAccount.accountValue) 
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Create Account
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