import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Calculator, 
  Repeat, 
  ShoppingCart, 
  Building, 
  Briefcase, 
  Factory,
  Award,
  Home,
  Layers,
  Globe,
  TrendingDown,
  GitBranch,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  Receipt,
  AlertCircle,
  FileCheck,
  DollarSign,
  Percent,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
}

interface AutomationWidgetsProps {
  transactions: Transaction[];
}

export const AutomationWidgets: React.FC<AutomationWidgetsProps> = ({ transactions }) => {
  const [activeAutomation, setActiveAutomation] = useState<string>('overview');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--spacing-4)',
      padding: 'var(--spacing-4)'
    }}>
      <div>
        <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Automation Center</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Industry-specific accounting tools powered by your transaction data
        </p>
      </div>

      <Tabs value={activeAutomation} onValueChange={setActiveAutomation}>
        <TabsList 
          className="grid w-full grid-cols-2 md:grid-cols-4"
          style={{
            backgroundColor: 'var(--card)',
            padding: 'var(--spacing-1)',
            borderRadius: 'var(--radius-xl)',
            gap: 'var(--spacing-1)'
          }}
        >
          <TabsTrigger 
            value="overview"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2)'
            }}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="industry"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2)'
            }}
          >
            Industry Tools
          </TabsTrigger>
          <TabsTrigger 
            value="reporting"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2)'
            }}
          >
            Reports
          </TabsTrigger>
          <TabsTrigger 
            value="analysis"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2)'
            }}
          >
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" style={{ marginTop: 'var(--spacing-4)' }}>
          <AutomationOverview transactions={transactions} />
        </TabsContent>

        <TabsContent value="industry" style={{ marginTop: 'var(--spacing-4)' }}>
          <IndustryAutomationTools transactions={transactions} />
        </TabsContent>

        <TabsContent value="reporting" style={{ marginTop: 'var(--spacing-4)' }}>
          <ReportingAutomation transactions={transactions} />
        </TabsContent>

        <TabsContent value="analysis" style={{ marginTop: 'var(--spacing-4)' }}>
          <AdvancedAnalysis transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview Component
const AutomationOverview: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    // Category breakdown
    const categoryTotals = transactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.type === 'expense' ? t.amount : 0;
      return acc;
    }, {} as Record<string, number>);

    return { totalIncome, totalExpenses, netIncome, categoryTotals };
  }, [transactions]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--spacing-4)'
    }}>
      <Card style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)'
      }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <DollarSign className="w-5 h-5" style={{ color: 'var(--success)' }} />
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ fontSize: '2rem', color: 'var(--success)' }}>
            ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)'
      }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <TrendingDown className="w-5 h-5" style={{ color: 'var(--destructive)' }} />
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ fontSize: '2rem', color: 'var(--destructive)' }}>
            ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)'
      }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Net Income
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ 
            fontSize: '2rem', 
            color: stats.netIncome >= 0 ? 'var(--success)' : 'var(--destructive)' 
          }}>
            ${Math.abs(stats.netIncome).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)'
      }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle>Top Expense Categories</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {Object.entries(stats.categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>{category}</span>
                  <span>${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Industry Automation Tools
const IndustryAutomationTools: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('saas');

  const industries = [
    { id: 'saas', name: 'SaaS & Subscriptions', icon: Repeat, color: 'var(--primary)' },
    { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart, color: 'var(--success)' },
    { id: 'construction', name: 'Construction', icon: Building, color: 'var(--warning)' },
    { id: 'restaurant', name: 'Restaurant', icon: Briefcase, color: 'var(--destructive)' },
    { id: 'manufacturing', name: 'Manufacturing', icon: Factory, color: 'var(--secondary)' },
    { id: 'nonprofit', name: 'Nonprofit', icon: Award, color: 'var(--accent)' },
    { id: 'realestate', name: 'Real Estate', icon: Home, color: 'var(--primary)' },
  ];

  return (
    <div>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 'var(--spacing-3)',
        marginBottom: 'var(--spacing-4)'
      }}>
        {industries.map(industry => {
          const Icon = industry.icon;
          const isActive = selectedIndustry === industry.id;
          return (
            <Card
              key={industry.id}
              onClick={() => setSelectedIndustry(industry.id)}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-xl)',
                border: isActive ? `2px solid ${industry.color}` : '1px solid var(--border)',
                backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--card)',
                transition: 'all 0.2s ease'
              }}
              className="hover:shadow-lg"
            >
              <CardContent style={{ 
                padding: 'var(--spacing-4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                textAlign: 'center'
              }}>
                <Icon className="w-8 h-8" style={{ color: industry.color }} />
                <span style={{ fontSize: '0.875rem' }}>{industry.name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedIndustry === 'saas' && <SaaSAutomation transactions={transactions} />}
      {selectedIndustry === 'ecommerce' && <EcommerceAutomation transactions={transactions} />}
      {selectedIndustry === 'construction' && <ConstructionAutomation transactions={transactions} />}
      {selectedIndustry === 'restaurant' && <RestaurantAutomation transactions={transactions} />}
      {selectedIndustry === 'manufacturing' && <ManufacturingAutomation transactions={transactions} />}
      {selectedIndustry === 'nonprofit' && <NonprofitAutomation transactions={transactions} />}
      {selectedIndustry === 'realestate' && <RealEstateAutomation transactions={transactions} />}
    </div>
  );
};

// SaaS Automation
const SaaSAutomation: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [mrr, setMrr] = useState('');
  const [churnRate, setChurnRate] = useState('');
  const [ltv, setLtv] = useState<number | null>(null);

  const calculateLTV = () => {
    const monthlyRevenue = parseFloat(mrr);
    const churn = parseFloat(churnRate) / 100;
    if (!isNaN(monthlyRevenue) && !isNaN(churn) && churn > 0) {
      setLtv(monthlyRevenue / churn);
    }
  };

  const subscriptionRevenue = transactions
    .filter(t => t.type === 'income' && (t.tags?.includes('subscription') || t.category.toLowerCase().includes('subscription')))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Repeat className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          SaaS Revenue Recognition (ASC 606)
        </CardTitle>
        <CardDescription>
          Calculate MRR, ARR, LTV, and track subscription revenue
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Auto-detected subscription revenue */}
          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--success-soft)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '3px solid var(--success)'
          }}>
            <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-1)' }}>
              <strong>Detected Subscription Revenue:</strong>
            </p>
            <p style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
              ${subscriptionRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              From transactions tagged with "subscription"
            </p>
          </div>

          {/* LTV Calculator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div>
              <Label htmlFor="mrr">Monthly Recurring Revenue</Label>
              <Input
                id="mrr"
                type="number"
                placeholder="5000"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
                style={{
                  marginTop: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
            </div>
            <div>
              <Label htmlFor="churn">Churn Rate (%)</Label>
              <Input
                id="churn"
                type="number"
                placeholder="5"
                value={churnRate}
                onChange={(e) => setChurnRate(e.target.value)}
                style={{
                  marginTop: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
            </div>
          </div>

          <Button
            onClick={calculateLTV}
            style={{
              backgroundColor: 'var(--primary)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Customer LTV
          </Button>

          {ltv !== null && (
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--primary-soft)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                Customer Lifetime Value
              </p>
              <p style={{ fontSize: '2rem', color: 'var(--primary)' }}>
                ${ltv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div style={{ 
            padding: 'var(--spacing-3)', 
            backgroundColor: 'var(--accent-soft)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <p style={{ fontSize: '0.875rem' }}>
              <strong>💡 Tip:</strong> Tag transactions with "subscription" to automatically track recurring revenue
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// E-commerce Automation
const EcommerceAutomation: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const stats = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const marketplaceFees = transactions.filter(t => 
      t.type === 'expense' && (
        t.description.toLowerCase().includes('fee') ||
        t.category.toLowerCase().includes('fee')
      )
    ).reduce((sum, t) => sum + t.amount, 0);
    const refunds = transactions.filter(t => 
      t.description.toLowerCase().includes('refund')
    ).reduce((sum, t) => sum + t.amount, 0);
    
    return { sales, marketplaceFees, refunds, netRevenue: sales - marketplaceFees - refunds };
  }, [transactions]);

  return (
    <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <ShoppingCart className="w-5 h-5" style={{ color: 'var(--success)' }} />
          E-commerce Accounting
        </CardTitle>
        <CardDescription>
          Track sales, fees, refunds, and calculate true profitability
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Gross Sales</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
              ${stats.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Marketplace Fees</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--destructive)' }}>
              ${stats.marketplaceFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Refunds</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>
              ${stats.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--primary-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--primary)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Net Revenue</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
              ${stats.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div style={{ 
          marginTop: 'var(--spacing-4)',
          padding: 'var(--spacing-3)', 
          backgroundColor: 'var(--accent-soft)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <p style={{ fontSize: '0.875rem' }}>
            <strong>📊 Margin Analysis:</strong> {((stats.netRevenue / stats.sales) * 100).toFixed(1)}% net margin after fees and refunds
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Construction Automation
const ConstructionAutomation: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [selectedProject, setSelectedProject] = useState('all');
  
  const projects = useMemo(() => {
    const projectTags = new Set<string>();
    transactions.forEach(t => {
      t.tags?.forEach(tag => {
        if (tag.startsWith('project-') || tag.startsWith('job-')) {
          projectTags.add(tag);
        }
      });
    });
    return Array.from(projectTags);
  }, [transactions]);

  const projectData = useMemo(() => {
    const filtered = selectedProject === 'all' 
      ? transactions 
      : transactions.filter(t => t.tags?.includes(selectedProject));
    
    const costs = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const revenue = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { costs, revenue, profit, margin };
  }, [transactions, selectedProject]);

  return (
    <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Building className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          Construction Job Costing
        </CardTitle>
        <CardDescription>
          Track costs and profitability by project
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <Label htmlFor="project-select">Select Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger 
              id="project-select"
              style={{
                marginTop: 'var(--spacing-2)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project} value={project}>
                  {project.replace(/^(project-|job-)/, '').replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {projects.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--accent-soft)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.875rem' }}>
              <strong>💡 Tip:</strong> Tag transactions with "project-[name]" or "job-[name]" to track job costs
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div style={{
                padding: 'var(--spacing-3)',
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Total Costs</p>
                <p style={{ fontSize: '1.5rem', color: 'var(--destructive)' }}>
                  ${projectData.costs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div style={{
                padding: 'var(--spacing-3)',
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Revenue</p>
                <p style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                  ${projectData.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: projectData.profit >= 0 ? 'var(--success-soft)' : 'var(--destructive-soft)',
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${projectData.profit >= 0 ? 'var(--success)' : 'var(--destructive)'}`
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                Project Profit
              </p>
              <p style={{ fontSize: '2rem', color: projectData.profit >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                ${Math.abs(projectData.profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-2)' }}>
                Margin: {projectData.margin.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Restaurant Automation
const RestaurantAutomation: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const stats = useMemo(() => {
    const foodCosts = transactions.filter(t => 
      t.type === 'expense' && (
        t.category.toLowerCase().includes('food') ||
        t.category.toLowerCase().includes('ingredient') ||
        t.category.toLowerCase().includes('supplies')
      )
    ).reduce((sum, t) => sum + t.amount, 0);

    const laborCosts = transactions.filter(t => 
      t.type === 'expense' && (
        t.category.toLowerCase().includes('payroll') ||
        t.category.toLowerCase().includes('labor') ||
        t.category.toLowerCase().includes('wage')
      )
    ).reduce((sum, t) => sum + t.amount, 0);

    const revenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const primeCost = foodCosts + laborCosts;
    const primeCostPercentage = revenue > 0 ? (primeCost / revenue) * 100 : 0;

    return { foodCosts, laborCosts, revenue, primeCost, primeCostPercentage };
  }, [transactions]);

  return (
    <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Briefcase className="w-5 h-5" style={{ color: 'var(--destructive)' }} />
          Restaurant Prime Cost Analysis
        </CardTitle>
        <CardDescription>
          Track food costs + labor = prime cost percentage
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div style={{
              padding: 'var(--spacing-3)',
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Food Costs</p>
              <p style={{ fontSize: '1.25rem' }}>
                ${stats.foodCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-3)',
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Labor Costs</p>
              <p style={{ fontSize: '1.25rem' }}>
                ${stats.laborCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-3)',
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Revenue</p>
              <p style={{ fontSize: '1.25rem', color: 'var(--success)' }}>
                ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div style={{
            padding: 'var(--spacing-4)',
            backgroundColor: stats.primeCostPercentage <= 65 ? 'var(--success-soft)' : 'var(--warning-soft)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${stats.primeCostPercentage <= 65 ? 'var(--success)' : 'var(--warning)'}`,
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
              Prime Cost Percentage
            </p>
            <p style={{ fontSize: '3rem', color: stats.primeCostPercentage <= 65 ? 'var(--success)' : 'var(--warning)' }}>
              {stats.primeCostPercentage.toFixed(1)}%
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-2)' }}>
              {stats.primeCostPercentage <= 65 ? '✅ Healthy prime cost (target: 60-65%)' : '⚠️ High prime cost (target: 60-65%)'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Placeholder components for other industries
const ManufacturingAutomation: React.FC<{ transactions: Transaction[] }> = () => (
  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
    <CardHeader style={{ padding: 'var(--spacing-4)' }}>
      <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <Factory className="w-5 h-5" />
        Manufacturing Cost Accounting
      </CardTitle>
    </CardHeader>
    <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
      <p>Track raw materials, WIP, finished goods, and COGS calculations.</p>
    </CardContent>
  </Card>
);

const NonprofitAutomation: React.FC<{ transactions: Transaction[] }> = () => (
  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
    <CardHeader style={{ padding: 'var(--spacing-4)' }}>
      <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <Award className="w-5 h-5" />
        Nonprofit Fund Accounting
      </CardTitle>
    </CardHeader>
    <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
      <p>Track restricted vs unrestricted funds, grants, and functional expense allocation.</p>
    </CardContent>
  </Card>
);

const RealEstateAutomation: React.FC<{ transactions: Transaction[] }> = () => (
  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
    <CardHeader style={{ padding: 'var(--spacing-4)' }}>
      <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <Home className="w-5 h-5" />
        Real Estate Property Management
      </CardTitle>
    </CardHeader>
    <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
      <p>Track rental income, expenses, NOI, and cap rates by property.</p>
    </CardContent>
  </Card>
);

// Reporting Automation
const ReportingAutomation: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <GitBranch className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Department P&L
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            Tag transactions with departments to see P&L by department
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Generate Report
          </Button>
        </CardContent>
      </Card>

      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--success)' }} />
            Rolling Forecast
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            12-month forecast based on historical trends
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Generate Forecast
          </Button>
        </CardContent>
      </Card>

      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Layers className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            Multi-Entity Consolidation
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            Consolidate financials across multiple entities
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Consolidate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Advanced Analysis
const AdvancedAnalysis: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Cohort Analysis
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            Analyze customer retention and revenue by cohort
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Run Analysis
          </Button>
        </CardContent>
      </Card>

      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <TrendingDown className="w-5 h-5" style={{ color: 'var(--success)' }} />
            Loan Amortization
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            Calculate principal vs interest splits
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Calculate
          </Button>
        </CardContent>
      </Card>

      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            Royalty Tracking
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
            Track licensing agreements and royalty payments
          </p>
          <Button style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
            Track Royalties
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
