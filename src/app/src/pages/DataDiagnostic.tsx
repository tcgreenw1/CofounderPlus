import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Briefcase
} from 'lucide-react';
import { useBusiness } from '../components/BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface DiagnosticData {
  businessId: string;
  userId: string;
  timestamp: string;
  transactions: { count: number; items: any[] };
  budgets: { count: number; items: any[] };
  leads: { count: number; items: any[] };
  deals: { count: number; items: any[] };
  customers: { count: number; items: any[] };
  emailSequences: { count: number; items: any[] };
  campaigns: { count: number; items: any[] };
  marketingLeads: { count: number; items: any[] };
  teamMembers: { count: number; items: any[] };
  contractors: { count: number; items: any[] };
  benefits: { count: number; items: any[] };
  performances: { count: number; items: any[] };
  handbooks: { count: number; items: any[] };
  onboarding: { count: number; items: any[] };
  roadmapTasks: { count: number; items: any[] };
}

export default function DataDiagnostic() {
  const { selectedBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const runDiagnostic = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/database-diagnostic?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      setDiagnosticData(data.data);
      toast.success('Diagnostic complete!');
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setError(err.message);
      toast.error(`Diagnostic failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderDataSection = (
    title: string,
    icon: React.ReactNode,
    data: { count: number; items: any[] },
    sectionKey: string,
    color: string
  ) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <Card key={sectionKey} style={{ borderColor: 'var(--color-border-primary)' }}>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => toggleSection(sectionKey)}
          style={{ 
            padding: 'var(--spacing-4)',
            borderBottom: isExpanded ? '1px solid var(--color-border-primary)' : 'none'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
              <div style={{ color }}>
                {icon}
              </div>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  {data.count} record{data.count !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={data.count > 0 ? 'default' : 'secondary'}
              style={{
                backgroundColor: data.count > 0 ? color : 'var(--color-surface-tertiary)',
                color: data.count > 0 ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              {data.count}
            </Badge>
          </div>
        </CardHeader>
        
        {isExpanded && data.count > 0 && (
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              {data.items.map((item, idx) => (
                <Card key={idx} style={{ 
                  backgroundColor: 'var(--color-surface-secondary)',
                  padding: 'var(--spacing-3)'
                }}>
                  <pre style={{ 
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    margin: 0,
                    color: 'var(--color-text-primary)'
                  }}>
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div style={{ 
      padding: 'var(--spacing-6)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-4)'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.875rem',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-2)'
            }}>
              Database Diagnostic
            </h1>
            <p style={{ 
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem'
            }}>
              Verify that all GPT-5.1 CRUD functions are working correctly
            </p>
          </div>
          
          <Button
            onClick={runDiagnostic}
            disabled={loading || !selectedBusiness}
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-on-accent)',
              gap: 'var(--spacing-2)'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Run Diagnostic'}
          </Button>
        </div>

        {!selectedBusiness && (
          <Alert style={{ backgroundColor: 'var(--color-warning-bg)' }}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select a business from the dropdown to run diagnostics
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {diagnosticData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Card style={{ 
            backgroundColor: 'var(--color-accent-primary)',
            color: 'white',
            borderColor: 'var(--color-accent-primary)'
          }}>
            <CardHeader style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                <CheckCircle className="w-5 h-5" />
                <CardTitle style={{ color: 'white' }}>Diagnostic Complete</CardTitle>
              </div>
              <CardDescription style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Last run: {new Date(diagnosticData.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-4)'
          }}>
            {/* Finance Section */}
            {renderDataSection(
              'Transactions',
              <DollarSign className="w-5 h-5" />,
              diagnosticData.transactions,
              'transactions',
              '#10b981'
            )}
            
            {renderDataSection(
              'Budgets',
              <Briefcase className="w-5 h-5" />,
              diagnosticData.budgets,
              'budgets',
              '#3b82f6'
            )}

            {/* Sales Section */}
            {renderDataSection(
              'Sales Leads',
              <TrendingUp className="w-5 h-5" />,
              diagnosticData.leads,
              'leads',
              '#f59e0b'
            )}
            
            {renderDataSection(
              'Deals',
              <DollarSign className="w-5 h-5" />,
              diagnosticData.deals,
              'deals',
              '#10b981'
            )}
            
            {renderDataSection(
              'Customers',
              <Users className="w-5 h-5" />,
              diagnosticData.customers,
              'customers',
              '#8b5cf6'
            )}
            
            {renderDataSection(
              'Email Sequences',
              <Package className="w-5 h-5" />,
              diagnosticData.emailSequences,
              'emailSequences',
              '#ec4899'
            )}

            {/* Marketing Section */}
            {renderDataSection(
              'Marketing Campaigns',
              <TrendingUp className="w-5 h-5" />,
              diagnosticData.campaigns,
              'campaigns',
              '#6366f1'
            )}
            
            {renderDataSection(
              'Marketing Leads',
              <Users className="w-5 h-5" />,
              diagnosticData.marketingLeads,
              'marketingLeads',
              '#14b8a6'
            )}

            {/* HR Section */}
            {renderDataSection(
              'Team Members',
              <Users className="w-5 h-5" />,
              diagnosticData.teamMembers,
              'teamMembers',
              '#f43f5e'
            )}
            
            {renderDataSection(
              'Contractors',
              <Users className="w-5 h-5" />,
              diagnosticData.contractors,
              'contractors',
              '#a855f7'
            )}
            
            {renderDataSection(
              'Employee Benefits',
              <Package className="w-5 h-5" />,
              diagnosticData.benefits,
              'benefits',
              '#06b6d4'
            )}
            
            {renderDataSection(
              'Performance Reviews',
              <TrendingUp className="w-5 h-5" />,
              diagnosticData.performances,
              'performances',
              '#84cc16'
            )}
            
            {renderDataSection(
              'Handbooks',
              <Package className="w-5 h-5" />,
              diagnosticData.handbooks,
              'handbooks',
              '#f97316'
            )}
            
            {renderDataSection(
              'Onboarding Materials',
              <Package className="w-5 h-5" />,
              diagnosticData.onboarding,
              'onboarding',
              '#eab308'
            )}

            {/* Product Section */}
            {renderDataSection(
              'Roadmap Tasks',
              <Package className="w-5 h-5" />,
              diagnosticData.roadmapTasks,
              'roadmapTasks',
              '#6366f1'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
