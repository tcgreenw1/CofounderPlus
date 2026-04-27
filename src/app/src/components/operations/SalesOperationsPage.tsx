import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Mail, 
  Users, 
  Target,
  DollarSign,
  Percent,
  CheckCircle,
  Plus,
  Loader2,
  Building2,
  Phone,
  Globe,
  Briefcase,
  Search,
  Edit,
  Trash2,
  BarChart3,
  Sparkles,
  AlertCircle,
  Bell,
  AlertTriangle,
  FileText,
  Calendar,
  Download,
  Flame,
  Import,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useIsMobile } from '../ui/use-mobile';
import { AutomationInputDialog } from '../AutomationInputDialog';
import { useCredits } from '../../hooks/useCredits';
import { useNavigate } from 'react-router-dom';
import { SalesChat } from './SalesChat';
import { Checkbox } from '../ui/checkbox';
import { HotLeadsTab } from './HotLeadsTab';
import { DealsTab } from './DealsTab';
import { AccountsTab } from './AccountsTab';
import { LossesTab } from './LossesTab';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface SalesOperationsPageProps {
  user?: any;
  userData?: any;
}

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  contact: string;
  email: string;
  createdAt: string;
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

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  createdAt: string;
}

interface SalesStats {
  pipelineValue: number;
  winRate: number;
  activeDeals: number;
  totalLeads: number;
}

// Google Connection Card Component
function GoogleConnectionCard({ 
  user, 
  googleConnected, 
  googleUserInfo, 
  isCheckingGoogle,
  onConnect, 
  onDisconnect 
}: any) {
  if (isCheckingGoogle) {
    return (
      <Card style={{ 
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 'var(--spacing-2)'
          }}>
            <Loader2 className="size-4 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
            <span style={{ color: 'var(--color-muted-foreground)' }}>Checking Google connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (googleConnected && googleUserInfo) {
    return (
      <Alert style={{ 
        background: 'var(--color-success-soft)',
        border: '1px solid var(--color-success)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <CheckCircle className="size-4" style={{ color: 'var(--color-success)' }} />
        <AlertDescription>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 'var(--spacing-4)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              {googleUserInfo.picture && (
                <img 
                  src={googleUserInfo.picture} 
                  alt={googleUserInfo.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    border: '2px solid var(--color-success)'
                  }}
                />
              )}
              <div>
                <p style={{ color: 'var(--color-foreground)' }}>
                  <strong>{googleUserInfo.name}</strong> ({googleUserInfo.email})
                </p>
                <p style={{ 
                  color: 'var(--color-muted-foreground)',
                  fontSize: '0.875rem',
                  marginTop: 'var(--spacing-1)'
                }}>
                  Google account connected - Email automation ready
                </p>
              </div>
            </div>
            <Button
              onClick={onDisconnect}
              variant="outline"
              size="sm"
              style={{ borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)' }}
            >
              Disconnect
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert style={{ 
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))',
      border: '1px solid #fbbf24',
      borderRadius: 'var(--radius-lg)',
    }}>
      <AlertCircle className="size-4" style={{ color: '#f59e0b' }} />
      <AlertDescription>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          flexWrap: 'wrap'
        }}>
          <div>
            <p style={{ color: 'var(--color-foreground)' }}>
              <strong>Connect your Google account</strong>
            </p>
            <p style={{ 
              color: 'var(--color-muted-foreground)',
              fontSize: '0.875rem',
              marginTop: 'var(--spacing-1)'
            }}>
              Enable email automation, calendar sync, and CRM features
            </p>
          </div>
          <Button
            onClick={onConnect}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              color: 'white',
              border: 'none',
              gap: 'var(--spacing-2)'
            }}
          >
            <Mail className="size-4" />
            Connect Google
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Sales Statistics Dashboard
function SalesStatsDashboard({ stats, isLoading }: { stats: SalesStats; isLoading: boolean }) {
  const statCards = [
    {
      title: 'Pipeline Value',
      value: isLoading ? '—' : `$${stats.pipelineValue.toLocaleString()}`,
      icon: DollarSign,
      color: '#27D17C',
      bgColor: 'var(--color-success-soft)',
    },
    {
      title: 'Win Rate',
      value: isLoading ? '—' : `${stats.winRate}%`,
      icon: Percent,
      color: '#007AFF',
      bgColor: 'rgba(0, 122, 255, 0.1)',
    },
    {
      title: 'Active Deals',
      value: isLoading ? '—' : stats.activeDeals.toString(),
      icon: Target,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Total Leads',
      value: isLoading ? '—' : stats.totalLeads.toString(),
      icon: Users,
      color: '#d4183d',
      bgColor: 'rgba(212, 24, 61, 0.1)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 'var(--spacing-4)',
    }}>
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <CardContent style={{ padding: 'var(--spacing-6)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                gap: 'var(--spacing-3)'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    color: 'var(--color-muted-foreground)',
                    fontSize: '0.875rem',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    {stat.title}
                  </p>
                  <h2 style={{
                    color: 'var(--color-foreground)',
                    margin: 0,
                  }}>
                    {stat.value}
                  </h2>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  background: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <stat.icon className="size-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Quick Actions Tab Content - Sales Automations
function QuickActionsTab({ 
  user, 
  selectedBusiness, 
  onRunAutomation 
}: { 
  user: any; 
  selectedBusiness: any;
  onRunAutomation: (automationId: string, title: string, creditCost: number) => void;
}) {
  const isMobile = useIsMobile();
  const [automationReports, setAutomationReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const salesAutomations = [
    {
      id: 'lead-scoring-refresh',
      title: 'Lead Scoring & Prioritization',
      description: 'Reviews all leads and recalculates priority scores based on engagement patterns',
      icon: TrendingUp,
      color: '#f59e0b',
      creditCost: 35,
    },
    {
      id: 'pipeline-forecast-analysis',
      title: 'Pipeline Analysis & Forecasting',
      description: 'Reviews your sales pipeline and generates 30/60/90 day revenue forecasts',
      icon: BarChart3,
      color: '#007AFF',
      creditCost: 50,
    },
    {
      id: 'outreach-performance-review',
      title: 'Outreach Performance Review',
      description: 'Analyzes email sequences, call activities, and outreach campaigns',
      icon: Mail,
      color: '#6c5ce7',
      creditCost: 40,
    },
    {
      id: 'stalled-deal-detection',
      title: 'Stalled Deal Detection',
      description: 'Scans all open deals for warning signs and suggests recovery tactics',
      icon: AlertTriangle,
      color: '#d4183d',
      creditCost: 30,
    },
    {
      id: 'follow-up-queue-builder',
      title: 'Follow-up Queue Builder',
      description: 'Creates prioritized follow-up tasks with context and talking points',
      icon: Bell,
      color: '#27D17C',
      creditCost: 25,
    },
  ];

  // Load automation reports
  useEffect(() => {
    const loadAutomationReports = async () => {
      if (!selectedBusiness?.id) return;
      
      setIsLoadingReports(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/automations/history?businessId=${selectedBusiness.id}&category=sales`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAutomationReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error loading automation reports:', error);
      } finally {
        setIsLoadingReports(false);
      }
    };

    loadAutomationReports();
  }, [selectedBusiness?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Sales Automations Grid */}
      <div>
        <h3 style={{ 
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-foreground)',
        }}>
          Sales Automations
        </h3>
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)' }}
        >
          {salesAutomations.map((automation, index) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
                style={{
                  background: 'var(--background)',
                  borderRadius: 'var(--radius-xl)',
                  height: '100%',
                }}
                onClick={() => onRunAutomation(automation.id, automation.title, automation.creditCost)}
              >
                <CardContent
                  className="flex flex-col items-center text-center"
                  style={{
                    padding: 'var(--spacing-4)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <Badge
                    variant="secondary"
                    style={{
                      position: 'absolute',
                      top: 'var(--spacing-2)',
                      right: 'var(--spacing-2)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      background: 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    {automation.creditCost} credits
                  </Badge>
                  <div 
                    style={{
                      background: `${automation.color}15`,
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <automation.icon className={isMobile ? 'size-4' : 'size-6'} style={{ color: automation.color }} />
                  </div>
                  <div>
                    <p style={{ 
                      fontWeight: 'var(--font-weight-semibold)', 
                      marginBottom: 'var(--spacing-1)',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      lineHeight: isMobile ? '1.2' : undefined,
                      color: 'var(--foreground)',
                    }}>
                      {automation.title}
                    </p>
                    {!isMobile && (
                      <p style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--muted-foreground)' }}>
                        {automation.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Automation Reports Table */}
      <div>
        <h3 style={{ 
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-foreground)',
        }}>
          Scheduled Automation Reports
        </h3>
        {isLoadingReports ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-8)',
            gap: 'var(--spacing-2)'
          }}>
            <Loader2 className="size-5 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
            <span style={{ color: 'var(--color-muted-foreground)' }}>Loading reports...</span>
          </div>
        ) : automationReports.length === 0 ? (
          <Card style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
              <FileText className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <h4 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
                No reports yet
              </h4>
              <p style={{ color: 'var(--color-muted-foreground)' }}>
                Automation reports from scheduled runs will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'var(--color-muted)',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <th style={{ 
                      padding: 'var(--spacing-3)',
                      textAlign: 'left',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                    }}>
                      Report
                    </th>
                    <th style={{ 
                      padding: 'var(--spacing-3)',
                      textAlign: 'left',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                    }}>
                      Generated
                    </th>
                    <th style={{ 
                      padding: 'var(--spacing-3)',
                      textAlign: 'left',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: 'var(--spacing-3)',
                      textAlign: 'right',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {automationReports.map((report, index) => (
                    <tr 
                      key={report.id || index}
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <td style={{ 
                        padding: 'var(--spacing-3)',
                        color: 'var(--color-foreground)',
                      }}>
                        {report.title || 'Automation Report'}
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-3)',
                        color: 'var(--color-muted-foreground)',
                        fontSize: '0.875rem',
                      }}>
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge style={{ 
                          background: report.status === 'completed' ? 'var(--color-success-soft)' : 'var(--color-warning-soft)',
                          color: report.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                          border: 'none',
                        }}>
                          {report.status || 'pending'}
                        </Badge>
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-3)',
                        textAlign: 'right',
                      }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to notifications to view report
                            window.location.href = '/notifications';
                          }}
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <FileText className="size-4" style={{ marginRight: 'var(--spacing-1)' }} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Sales Pipeline Tab Content
function SalesPipelineTab({ deals, isLoading, onEdit, onDelete }: any) {
  const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return '#007AFF';
      case 'qualification': return '#f59e0b';
      case 'proposal': return '#d4183d';
      case 'negotiation': return '#27D17C';
      case 'closed_won': return '#27D17C';
      case 'closed_lost': return '#717182';
      default: return 'var(--color-muted-foreground)';
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

  if (deals.length === 0) {
    return (
      <Card style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
          <Target className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
          <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
            No deals yet
          </h3>
          <p style={{ color: 'var(--color-muted-foreground)' }}>
            Get started by creating your first sales opportunity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      {deals.map((deal: Deal) => (
        <Card 
          key={deal.id}
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'space-between',
              gap: 'var(--spacing-4)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                  <h4 style={{ color: 'var(--color-foreground)', margin: 0 }}>{deal.name}</h4>
                  <Badge style={{ 
                    background: `${getStageColor(deal.stage)}20`,
                    color: getStageColor(deal.stage),
                    border: 'none',
                  }}>
                    {deal.stage.replace('_', ' ')}
                  </Badge>
                </div>
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                  {deal.company} • {deal.contact}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-4)',
                  marginTop: 'var(--spacing-3)'
                }}>
                  <span style={{ color: 'var(--color-foreground)' }}>
                    <strong>${deal.value.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                    {deal.probability}% probability
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
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
                  onClick={() => onDelete(deal.id)}
                  style={{ color: 'var(--color-destructive)' }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Email Tab Content
function EmailTab({ googleConnected }: { googleConnected: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {!googleConnected ? (
        <Alert style={{ 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))',
          border: '1px solid #fbbf24',
          borderRadius: 'var(--radius-lg)',
        }}>
          <AlertCircle className="size-4" style={{ color: '#f59e0b' }} />
          <AlertDescription>
            <p style={{ color: 'var(--color-foreground)' }}>
              <strong>Connect Google to unlock email features</strong>
            </p>
            <p style={{ 
              color: 'var(--color-muted-foreground)',
              fontSize: '0.875rem',
              marginTop: 'var(--spacing-1)'
            }}>
              Email sequences, campaigns, and automation require Google account connection
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Card style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
            <Mail className="size-12 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <h3 style={{ color: 'var(--color-foreground)', marginBottom: 'var(--spacing-2)' }}>
              Email automation coming soon
            </h3>
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              We're building powerful email sequences and automation tools
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SalesOperationsPage({ user, userData }: SalesOperationsPageProps) {
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const { checkCredits } = useCredits();
  const navigate = useNavigate();

  // Google OAuth state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  // Data state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    pipelineValue: 0,
    winRate: 0,
    activeDeals: 0,
    totalLeads: 0,
  });

  // UI state
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');

  // Automation state
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);

  // Handle running an automation
  const handleRunAutomation = async (automationId: string, title: string, creditCost: number) => {
    // Check credits first
    if (!checkCredits(creditCost)) {
      return;
    }

    // Set selected automation and open dialog
    setSelectedAutomation({ id: automationId, title, creditCost });
    setInputDialogOpen(true);
  };

  // Execute automation with user input
  const handleRunAutomationWithInput = async (userInput: Record<string, any>) => {
    if (!selectedBusiness?.id || !selectedAutomation) return;

    try {
      setRunningAutomation(selectedAutomation.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      toast.info(`Running ${selectedAutomation.title}...`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/automations/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            automationId: selectedAutomation.id,
            userInput
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`✅ Automation started! Check the Notifications page for results.`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => navigate('/notifications')
          }
        });
        console.log('🧪 Automation Started:', data);
      } else {
        toast.error(`Failed: ${data.error || 'Unknown error'}`);
        console.error('❌ Automation Error:', data);
      }
    } catch (error: any) {
      console.error('❌ Error running automation:', error);
      toast.error(error.message || 'Failed to run automation');
    } finally {
      setRunningAutomation(null);
      setInputDialogOpen(false);
      setSelectedAutomation(null);
    }
  };

  // Check Google connection status
  const checkGoogleConnection = async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setGoogleConnected(false);
        setIsCheckingGoogle(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/status?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (!response.ok) {
        setGoogleConnected(false);
        setIsCheckingGoogle(false);
        return;
      }

      const data = await response.json();
      
      if (data.connected) {
        setGoogleConnected(true);
        setGoogleUserInfo({
          email: data.email,
          name: data.name,
          picture: data.picture
        });
      } else {
        setGoogleConnected(false);
      }
    } catch (error) {
      setGoogleConnected(false);
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  // Connect to Google
  const connectGoogle = async () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/auth-url?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      const data = await response.json();

      if (!data.success || !data.authUrl) {
        toast.error(data.error || 'Failed to get Google authorization URL');
        return;
      }

      window.location.href = data.authUrl;

    } catch (error: any) {
      console.error('Error connecting to Google:', error);
      toast.error(error.message || 'Failed to connect to Google');
    }
  };

  // Disconnect from Google
  const disconnectGoogle = async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/disconnect`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const data = await response.json();

      if (data.success) {
        setGoogleConnected(false);
        setGoogleUserInfo(null);
        toast.success('Google disconnected successfully');
      } else {
        toast.error(data.error || 'Failed to disconnect Google');
      }
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast.error(error.message || 'Failed to disconnect Google');
    }
  };

  // Load sales data
  const loadSalesData = async () => {
    if (!selectedBusiness?.id) return;

    setIsLoadingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales`;

      // Fetch deals
      const dealsRes = await fetch(`${baseUrl}/pipeline?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.pipeline || []);
      }

      // Fetch leads
      const leadsRes = await fetch(`${baseUrl}/leads?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }

      // Fetch customers
      const customersRes = await fetch(`${baseUrl}/customers?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);
      }

      // Fetch analytics for stats
      const analyticsRes = await fetch(`${baseUrl}/analytics?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        const analytics = analyticsData.analytics;
        
        setSalesStats({
          pipelineValue: analytics?.pipeline?.totalValue || 0,
          winRate: analytics?.pipeline?.winRate || 0,
          activeDeals: analytics?.pipeline?.active || 0,
          totalLeads: analytics?.leads?.total || 0,
        });
      }
    } catch (error: any) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Check Google connection on mount
  useEffect(() => {
    checkGoogleConnection();
  }, [user?.id]);

  // Load sales data when business changes
  useEffect(() => {
    if (selectedBusiness?.id) {
      loadSalesData();
    }
  }, [selectedBusiness?.id]);

  // Handle edit deal
  const handleEditDeal = async (deal: any) => {
    if (!selectedBusiness?.id) {
      toast.error('No business selected');
      return;
    }

    // For now, just toast - you can add a dialog later
    toast.info('Edit deal functionality coming soon');
  };

  // Handle delete deal
  const handleDeleteDeal = async (dealId: string) => {
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals/${dealId}?businessId=${selectedBusiness.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        toast.success('Deal deleted');
        // No need to reload - the UI already updated optimistically in DealsTab
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete deal');
      }
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error(error.message || 'Failed to delete deal');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-6)',
      padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="grid w-full grid-cols-6 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-1)',
            ...(isMobile && {
              position: 'sticky',
              top: '0',
              zIndex: 10,
              marginBottom: 'var(--spacing-3)',
              overflowX: 'auto'
            })
          }}
        >
          <TabsTrigger 
            value="actions"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="sales"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Hot Leads
          </TabsTrigger>
          <TabsTrigger 
            value="deals"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Deals
          </TabsTrigger>
          <TabsTrigger 
            value="accounts"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Accounts
          </TabsTrigger>
          <TabsTrigger 
            value="losses"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-yellow-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Losses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <QuickActionsTab
            user={user}
            selectedBusiness={selectedBusiness}
            onRunAutomation={handleRunAutomation}
          />
        </TabsContent>

        <TabsContent value="chat" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <div style={{
            ...(isMobile && {
              height: 'calc(100dvh - 160px)', 
              maxHeight: 'calc(100dvh - 160px)',
              overflow: 'hidden'
            })
          }}>
            <UnifiedDepartmentChat user={user} department="sales" />
          </div>
        </TabsContent>

        <TabsContent value="sales" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <HotLeadsTab
            selectedBusiness={selectedBusiness}
            onEdit={(lead: HotLead) => toast.info('Edit lead coming soon')}
            onDelete={(id: string) => toast.info('Delete lead coming soon')}
          />
        </TabsContent>

        <TabsContent value="deals" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <DealsTab
            selectedBusiness={selectedBusiness}
            onEdit={handleEditDeal}
            onDelete={handleDeleteDeal}
          />
        </TabsContent>

        <TabsContent value="accounts" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <AccountsTab
            selectedBusiness={selectedBusiness}
            user={user}
            onEdit={(account: any) => toast.info('Edit account coming soon')}
            onDelete={(id: string) => toast.info('Delete account coming soon')}
          />
        </TabsContent>

        <TabsContent value="losses" style={{ marginTop: isMobile ? 0 : 'var(--spacing-6)' }}>
          <LossesTab
            selectedBusiness={selectedBusiness}
            user={user}
            onEdit={(loss: any) => toast.info('Edit loss coming soon')}
            onDelete={(id: string) => toast.info('Delete loss coming soon')}
          />
        </TabsContent>
      </Tabs>

      {/* Automation Input Dialog */}
      {selectedAutomation && (
        <AutomationInputDialog
          open={inputDialogOpen}
          onClose={() => {
            setInputDialogOpen(false);
            setSelectedAutomation(null);
          }}
          automationId={selectedAutomation.id}
          automationTitle={selectedAutomation.title}
          onSubmit={handleRunAutomationWithInput}
          isLoading={runningAutomation === selectedAutomation.id}
        />
      )}
    </div>
  );
}

export default SalesOperationsPage;