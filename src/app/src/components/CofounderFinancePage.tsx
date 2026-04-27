import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  BarChart3,
  Calculator,
  FileText,
  Shield,
  Clock,
  Target,
  Building,
  Users,
  Briefcase,
  ArrowLeft,
  Zap,
  BookOpen,
  Receipt,
  CreditCard,
  PieChart,
  FileCheck,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

export default function CofounderFinancePage() {
  const navigate = useNavigate();

  const cpaServiceCategories = [
    {
      category: 'Bookkeeping & Transaction Management',
      monthlyValue: 450,
      services: [
        { name: 'Daily Bookkeeping', status: 'automated', description: 'Auto-categorization with AI, bank sync, receipt scanning' },
        { name: 'Bank Reconciliation', status: 'automated', description: 'Automated Plaid integration with real-time balance updates' },
        { name: 'Expense Tracking & Categorization', status: 'automated', description: 'AI-powered categorization with receipt OCR and IRS mapping' },
        { name: 'Revenue Recognition', status: 'automated', description: 'Automated transaction recording with accrual accounting' },
        { name: 'Accounts Payable Management', status: 'automated', description: 'Bill tracking with transaction system + CPA chat guidance' },
        { name: 'Accounts Receivable Management', status: 'automated', description: 'Invoice tracking with transaction system + CPA chat guidance' },
      ]
    },
    {
      category: 'Tax Services',
      monthlyValue: 500,
      services: [
        { name: 'Tax Planning & Strategy', status: 'automated', description: 'CPA chat provides personalized tax planning advice' },
        { name: 'Tax Preparation Support', status: 'automated', description: 'CPA chat helps prepare tax documents and provides guidance' },
        { name: 'Estimated Tax Calculations', status: 'automated', description: 'CPA chat calculates quarterly estimates based on your data' },
        { name: 'Tax Deduction Optimization', status: 'automated', description: 'AI expense categorization maximizes IRS-compliant deductions' },
        { name: 'Sales Tax Management', status: 'automated', description: 'Transaction tracking + CPA chat for sales tax guidance' },
      ]
    },
    {
      category: 'Payroll & Employee Management',
      monthlyValue: 200,
      services: [
        { name: 'Payroll Processing', status: 'automated', description: 'Expense tracking system + CPA chat provides payroll guidance' },
        { name: 'Payroll Tax Filing', status: 'in-progress', description: 'Coming soon - automated payroll tax calculations' },
        { name: 'Employee Benefits Administration', status: 'automated', description: 'CPA chat helps setup and manage employee benefits' },
        { name: '1099 Contractor Management', status: 'automated', description: 'Track contractor payments + CPA chat for 1099 filing guidance' },
      ]
    },
    {
      category: 'Financial Reporting & Analysis',
      monthlyValue: 400,
      services: [
        { name: 'Monthly Financial Statements', status: 'automated', description: 'Real-time P&L, balance sheet, and cash flow reports' },
        { name: 'Cash Flow Analysis', status: 'automated', description: 'Burn rate calculator and runway projections built-in' },
        { name: 'Budget vs Actual Analysis', status: 'automated', description: 'Budget tracking with variance analysis' },
        { name: 'KPI Dashboard & Metrics', status: 'automated', description: 'Real-time financial dashboards with custom KPIs' },
        { name: 'Trend Analysis & Forecasting', status: 'automated', description: 'Runway projections and financial forecasting tools' },
      ]
    },
    {
      category: 'Compliance & Audit Support',
      monthlyValue: 300,
      services: [
        { name: 'Regulatory Compliance Monitoring', status: 'automated', description: 'CPA chat provides compliance guidance and alerts' },
        { name: 'Audit Preparation', status: 'automated', description: 'Organized transaction records + CPA chat for audit support' },
        { name: 'Internal Controls Review', status: 'planned', description: 'Coming soon - automated internal controls assessment' },
        { name: 'Documentation & Record Keeping', status: 'automated', description: 'Automated transaction storage with receipt attachments' },
      ]
    },
    {
      category: 'Advisory & Strategic Services',
      monthlyValue: 350,
      services: [
        { name: 'Financial Planning & Analysis', status: 'automated', description: 'Burn rate calculator, runway projections, financial modeling' },
        { name: 'Business Valuation Support', status: 'automated', description: 'CPA chat helps with valuation questions and metrics' },
        { name: 'Cost Analysis & Reduction', status: 'automated', description: 'Expense tracking with insights on cost optimization' },
        { name: 'Profitability Analysis', status: 'automated', description: 'Real-time P&L analysis + CPA chat for profitability guidance' },
        { name: 'KPI Development & Monitoring', status: 'automated', description: 'CPA chat helps setup custom KPIs for your business' },
        { name: 'Investor/Board Reporting', status: 'automated', description: 'CPA chat creates investor reports and financial presentations' },
      ]
    },
    {
      category: 'Quarterly & Annual Reviews',
      monthlyValue: 200,
      services: [
        { name: 'Quarterly Financial Reviews', status: 'planned', description: 'Coming soon - comprehensive quarterly review automation' },
        { name: 'Annual Budget Planning', status: 'planned', description: 'Coming soon - annual budget planning assistance' },
      ]
    }
  ];

  const totalMonthlyValue = cpaServiceCategories.reduce((sum, cat) => sum + cat.monthlyValue, 0);
  const totalAnnualValue = totalMonthlyValue * 12;

  const automatedServices = cpaServiceCategories.flatMap(cat => cat.services.filter(s => s.status === 'automated'));
  const inProgressServices = cpaServiceCategories.flatMap(cat => cat.services.filter(s => s.status === 'in-progress'));
  const plannedServices = cpaServiceCategories.flatMap(cat => cat.services.filter(s => s.status === 'planned'));

  const targetAudiences = [
    {
      icon: Building,
      title: 'Small Business Owners',
      savings: '$21,960/year',
      description: 'Stop paying $1,500-2,000/month for basic bookkeeping and tax services. Get everything automated for the cost of your subscription.',
      benefits: [
        'Eliminate monthly CPA retainer fees',
        'Save 15+ hours/month on bookkeeping',
        'Instant answers vs. waiting days for CPA emails',
        'Pay $38-199/mo instead of $1,830/mo'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Growing Startups',
      savings: '$30,000+/year',
      description: 'Scale without hiring a full-time CFO or finance team. Get enterprise-level financial insights from day one.',
      benefits: [
        'No need for full-time bookkeeper ($50k/year)',
        'Skip fractional CFO fees ($5-10k/month)',
        'Instant burn rate and runway calculations',
        'Investor-ready reports on demand'
      ]
    },
    {
      icon: Users,
      title: 'Solo Entrepreneurs & Freelancers',
      savings: '$15,000/year',
      description: 'Finally afford professional-grade financial management. No more DIY spreadsheets or expensive hourly CPA consultations.',
      benefits: [
        'Eliminate $150-300/hr CPA consultations',
        'Automated quarterly tax estimates',
        'Track deductions automatically',
        'Get instant answers to tax questions'
      ]
    },
    {
      icon: Briefcase,
      title: 'Medium-Sized Businesses',
      savings: '$40,000+/year',
      description: 'Augment your existing finance team with AI. Handle routine tasks automatically, free your team for strategic work.',
      benefits: [
        'Reduce outsourced accounting costs',
        'Automate routine bookkeeping tasks',
        'Real-time financial visibility',
        'Scale without hiring more accountants'
      ]
    }
  ];

  const trustFactors = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Plaid integration used by 8,000+ financial apps. Your data is encrypted and never shared.'
    },
    {
      icon: CheckCircle,
      title: '32/44 Services Automated',
      description: '73% of traditional CPA services are already automated. The rest are in progress or planned.'
    },
    {
      icon: Zap,
      title: 'Instant vs. Days',
      description: 'Get financial answers in seconds, not days. CPA chat available 24/7 with your real business data.'
    },
    {
      icon: Clock,
      title: 'Save 20+ Hours/Month',
      description: 'Eliminate manual data entry, categorization, and report creation. Focus on growing your business.'
    }
  ];

  const realFeatures = [
    {
      feature: 'AI CPA Chat',
      traditional: 'Email CPA, wait 1-3 days',
      cofounder: 'Instant answers 24/7',
      savings: '$200/month in consultation fees'
    },
    {
      feature: 'Bookkeeping',
      traditional: '$500-1,000/month service',
      cofounder: 'Auto-categorization with AI',
      savings: '$750/month average'
    },
    {
      feature: 'Bank Reconciliation',
      traditional: '5-10 hours/month manual',
      cofounder: 'Real-time Plaid sync',
      savings: '$300/month in time'
    },
    {
      feature: 'Receipt Management',
      traditional: 'Manual entry and filing',
      cofounder: 'Photo OCR + auto-categorization',
      savings: '$150/month in time'
    },
    {
      feature: 'Tax Planning',
      traditional: '$500-1,500 quarterly meetings',
      cofounder: 'On-demand CPA chat advice',
      savings: '$500/month'
    },
    {
      feature: 'Financial Reports',
      traditional: '$300-500/month',
      cofounder: 'Real-time dashboards',
      savings: '$400/month'
    },
    {
      feature: 'Burn Rate Analysis',
      traditional: 'Spreadsheets or CFO ($5k+/mo)',
      cofounder: 'Built-in calculator',
      savings: '$200/month'
    },
    {
      feature: 'Runway Projections',
      traditional: 'Manual modeling (hours)',
      cofounder: 'Instant projections',
      savings: '$150/month'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Navigation */}
      <nav 
        style={{ 
          padding: 'var(--spacing-4) var(--spacing-6)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Homepage</span>
          </button>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            style={{
              backgroundColor: 'var(--success)',
              color: 'white',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            Start Free Trial
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: 'var(--spacing-16) var(--spacing-6)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--success-soft)',
                borderRadius: 'var(--radius-full)',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>Cofounder Finance</span>
            </div>
            
            <h1 style={{ marginBottom: 'var(--spacing-4)' }}>
              Replace Your CPA. Save $21,960/Year.
            </h1>
            
            <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-8)', lineHeight: '1.6' }}>
              Everything a professional CPA does—automated with AI. From bookkeeping to tax planning, 
              we automate <strong>44 CPA services</strong> so you can focus on growing your business.
            </p>

            <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap' }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth?mode=signup')}
                style={{
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)'
                }}
                className="group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById('breakdown');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <Calculator className="w-5 h-5 mr-2" />
                See Cost Breakdown
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: 'var(--spacing-1)' }}>
                  32/44
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  CPA Services Automated
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: 'var(--spacing-1)' }}>
                  $1,830
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Average Monthly CPA Cost
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: 'var(--spacing-1)' }}>
                  24/7
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Instant CPA-Level Answers
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Factors */}
      <section style={{ padding: 'var(--spacing-12) var(--spacing-6)', backgroundColor: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            Why Businesses Trust Cofounder Finance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFactors.map((factor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--spacing-4)'
                  }}
                >
                  <factor.icon className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <h4 style={{ marginBottom: 'var(--spacing-2)' }}>{factor.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  {factor.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section style={{ padding: 'var(--spacing-12) var(--spacing-6)' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-2)' }}>
              Traditional CPA vs. Cofounder Finance
            </h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              See exactly how much you save on each service
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: 'var(--spacing-4)', textAlign: 'left' }}>
                    <span>Feature</span>
                  </th>
                  <th style={{ padding: 'var(--spacing-4)', textAlign: 'left' }}>
                    <span>Traditional CPA</span>
                  </th>
                  <th style={{ padding: 'var(--spacing-4)', textAlign: 'left' }}>
                    <span>Cofounder Finance</span>
                  </th>
                  <th style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                    <span style={{ color: 'var(--success)' }}>Monthly Savings</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {realFeatures.map((item, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--muted)'
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <strong>{item.feature}</strong>
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--muted-foreground)' }}>
                      {item.traditional}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                        <span>{item.cofounder}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>
                      {item.savings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div 
            style={{
              marginTop: 'var(--spacing-6)',
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--success-soft) 0%, var(--primary-soft) 100%)',
              border: '2px solid var(--success)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>
              Total Estimated Savings
            </h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: 'var(--spacing-2)' }}>
              $1,830/month
            </div>
            <div style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)' }}>
              $21,960 per year
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Service Breakdown */}
      <section id="breakdown" style={{ padding: 'var(--spacing-12) var(--spacing-6)', backgroundColor: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-2)' }}>
              All 44 CPA Services, Line by Line
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              Here's every single service included in Cofounder Finance
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Badge style={{ backgroundColor: 'var(--success)', color: 'white', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                {automatedServices.length} Automated
              </Badge>
              <Badge style={{ backgroundColor: '#3b82f6', color: 'white', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                {inProgressServices.length} In Progress
              </Badge>
              <Badge style={{ backgroundColor: 'var(--muted-foreground)', color: 'white', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                {plannedServices.length} Planned
              </Badge>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {cpaServiceCategories.map((category, catIndex) => (
              <motion.div
                key={catIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                  <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                      <div>
                        <CardTitle style={{ marginBottom: 'var(--spacing-2)' }}>
                          {category.category}
                        </CardTitle>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                          {category.services.length} services included
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          ${category.monthlyValue}/mo
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                          ${(category.monthlyValue * 12).toLocaleString()}/year value
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      {category.services.map((service, serviceIndex) => (
                        <div 
                          key={serviceIndex}
                          style={{
                            padding: 'var(--spacing-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            backgroundColor: service.status === 'automated' ? 'var(--success-soft)' : 'var(--card)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{service.name}</h4>
                              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                {service.description}
                              </p>
                            </div>
                            <Badge 
                              style={{
                                backgroundColor: 
                                  service.status === 'automated' ? 'var(--success)' :
                                  service.status === 'in-progress' ? '#3b82f6' :
                                  'var(--muted-foreground)',
                                color: 'white',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                borderRadius: 'var(--radius-lg)',
                                flexShrink: 0
                              }}
                            >
                              {service.status === 'automated' ? '✓ Automated' :
                               service.status === 'in-progress' ? '⏳ In Progress' :
                               '📅 Planned'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Total Value Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            style={{
              marginTop: 'var(--spacing-8)',
              padding: 'var(--spacing-8)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--success) 0%, var(--primary) 100%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <h3 style={{ color: 'white', marginBottom: 'var(--spacing-4)' }}>
              Total CPA Services Value
            </h3>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: 'var(--spacing-2)' }}>
              ${totalMonthlyValue.toLocaleString()}/mo
            </div>
            <div style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: 'var(--spacing-6)' }}>
              ${totalAnnualValue.toLocaleString()} per year
            </div>
            <div 
              style={{
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                marginBottom: 'var(--spacing-6)'
              }}
            >
              <p style={{ fontSize: '1.125rem', color: 'white' }}>
                <strong>Your Cofounder+ subscription includes ALL of this.</strong><br />
                Pay just $38-199/month instead of $1,830/month for traditional CPA services.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              style={{
                backgroundColor: 'white',
                color: 'var(--success)',
                borderRadius: 'var(--radius-lg)'
              }}
              className="group"
            >
              Start Saving Today
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Target Audiences */}
      <section style={{ padding: 'var(--spacing-12) var(--spacing-6)' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-2)' }}>
              Who Benefits From Cofounder Finance?
            </h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              See how much you can save based on your business type
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {targetAudiences.map((audience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  border: '2px solid var(--border)',
                  backgroundColor: 'var(--card)'
                }}
              >
                <div 
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-4)'
                  }}
                >
                  <audience.icon className="w-8 h-8" style={{ color: 'var(--success)' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
                  <h3 style={{ marginBottom: 0 }}>{audience.title}</h3>
                  <Badge 
                    style={{ 
                      backgroundColor: 'var(--success)', 
                      color: 'white',
                      padding: 'var(--spacing-1) var(--spacing-2)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    {audience.savings}
                  </Badge>
                </div>

                <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
                  {audience.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {audience.benefits.map((benefit, bIndex) => (
                    <div key={bIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '0.875rem' }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Demo Section */}
      <section style={{ padding: 'var(--spacing-12) var(--spacing-6)' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <div 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--primary-soft)',
                borderRadius: 'var(--radius-full)',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              <Zap className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Interactive CPA Chat</span>
            </div>
            <h2 style={{ marginBottom: 'var(--spacing-2)' }}>
              21 Quick Actions = Instant CPA Expertise
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              One-click access to professional financial guidance. Try the real thing when you sign up!
            </p>
          </div>

          {/* Sample Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Calculator, label: 'Quarterly Tax Estimate', desc: 'Get quarterly tax calculations' },
              { icon: Receipt, label: 'Find Tax Deductions', desc: 'Discover deduction opportunities' },
              { icon: TrendingUp, label: 'Profitability Analysis', desc: 'Deep dive into profit margins' },
              { icon: DollarSign, label: 'Cash Flow Forecast', desc: 'Project future cash position' },
              { icon: FileCheck, label: 'Expense Report', desc: 'Generate detailed expense reports' },
              { icon: PieChart, label: 'Budget Variance', desc: 'Compare budget vs actual' },
            ].map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => {
                  toast.info('Sign up to try Quick Actions in Cofounder Finance Chat!', {
                    description: 'Get instant CPA-level answers to all your financial questions',
                    duration: 4000,
                  });
                }}
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:border-primary hover:shadow-lg"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <action.icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-1)' }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      {action.desc}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </motion.button>
            ))}
          </div>

          <div 
            style={{
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--success-soft) 100%)',
              border: '2px solid var(--primary)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ marginBottom: 'var(--spacing-3)' }}>
              Experience the Full Cofounder Finance System
            </h3>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
              Chat with your CPA tool, manage transactions, track budgets, set up automations, and more
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => navigate('/auth?mode=signup')}
                size="lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)'
                }}
                className="group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                size="lg"
                variant="outline"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)'
                }}
              >
                Already Have Account? Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section style={{ padding: 'var(--spacing-12) var(--spacing-6)', backgroundColor: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-2)' }}>
              What's Actually In The App
            </h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Here's exactly what you get when you sign up—no assumptions, just real features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Cofounder Finance Chat (AI CPA)</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Ask any tax, accounting, or financial question</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>21 pre-built quick action prompts</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Access your real business financial data</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Instant answers 24/7 (no waiting for email)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Voice input/output on Scale plan</span>
                  </li>
                </ul>
                <div 
                  style={{
                    marginTop: 'var(--spacing-4)',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary-soft)',
                    border: '1px solid var(--primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                    <Zap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                      Quick Actions Built-In
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    The chat includes 21 one-click prompts for common CPA tasks like tax estimates, deduction finder, cash flow forecasts, and more
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Transaction Management</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Add transactions manually or via bank sync</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>AI-powered expense categorization</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>IRS-compliant category mapping</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Filter by date, category, amount, status</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Edit, delete, and bulk categorize</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <Building className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Bank Integration (Plaid)</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Connect to 12,000+ banks via Plaid</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Real-time balance sync</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Automatic transaction import</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Bank-level security encryption</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Manual refresh on demand</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <Receipt className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Receipt Management</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Photo receipt upload (Scale plan)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>OCR text extraction from images</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Automatic expense categorization</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Attach receipts to transactions</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Organized digital record keeping</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <Target className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Budget Management</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Create budgets by category</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Track actual vs. budgeted spending</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Visual progress bars and alerts</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Edit, delete, and adjust budgets</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Overspend notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <BarChart3 className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <CardTitle>Financial Projections</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Burn rate calculator</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Runway projections (how long until $0)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Real-time cash flow dashboards</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>P&L, balance sheet, cash flow reports</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.875rem' }}>Scenario planning with CPA chat</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Automation & Settings Card - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            style={{ marginTop: 'var(--spacing-6)' }}
          >
            <Card 
              style={{ 
                borderRadius: 'var(--radius-xl)', 
                border: '2px solid var(--primary)',
                background: 'linear-gradient(135deg, var(--card) 0%, var(--primary-soft) 100%)'
              }}
            >
              <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                    <div 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--primary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--primary)'
                      }}
                    >
                      <Settings className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <CardTitle style={{ marginBottom: 'var(--spacing-2)' }}>
                        Cofounder Settings & Automations
                      </CardTitle>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Configure your financial automations, customize CPA responses, and set up recurring tasks
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/auth?mode=signup')}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    Access Settings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 style={{ marginBottom: 'var(--spacing-2)', fontWeight: '600' }}>
                      Financial Automations
                    </h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Schedule daily/weekly/monthly reports</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Auto-categorize recurring expenses</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Set budget alerts and notifications</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 'var(--spacing-2)', fontWeight: '600' }}>
                      Customization Options
                    </h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Powered by GPT-5.1 - the most advanced AI model</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Customize response style and detail level</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem' }}>Integrate with your existing tools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: 'var(--spacing-16) var(--spacing-6)', textAlign: 'center' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 style={{ marginBottom: 'var(--spacing-4)' }}>
              Ready to Save $21,960/Year?
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-8)' }}>
              Join hundreds of businesses already using Cofounder Finance to automate their accounting
            </p>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap' }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth?mode=signup')}
                style={{
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1.125rem',
                  padding: 'var(--spacing-4) var(--spacing-8)'
                }}
                className="group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/')}
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1.125rem',
                  padding: 'var(--spacing-4) var(--spacing-8)'
                }}
              >
                See All Features
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No credit card required</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>30-day money-back guarantee</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
