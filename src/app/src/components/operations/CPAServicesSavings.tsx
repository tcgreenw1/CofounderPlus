import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Sparkles,
  PiggyBank,
  Calculator
} from 'lucide-react';

interface CPASavingsProps {
  automatedServicesCount: number;
  totalServicesCount: number;
}

// Average CPA costs for different services (monthly)
const CPA_SERVICE_COSTS = {
  bookkeeping: 300,
  financialStatements: 150,
  taxPreparation: 200,
  financialAnalysis: 250,
  payroll: 180,
  compliance: 200,
  advisory: 400
};

export function CPAServicesSavings({ automatedServicesCount, totalServicesCount }: CPASavingsProps) {
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);
  
  useEffect(() => {
    // Calculate estimated savings based on automated services
    // Each category contributes to overall savings
    const categoryBreakdown = {
      bookkeeping: 7,  // 7 automated bookkeeping services
      financialStatements: 5,  // 5 automated statement services
      taxPreparation: 5,  // 5 automated tax services
      financialAnalysis: 8,  // 8 automated analysis services
      payroll: 1,  // 1 automated payroll service
      compliance: 2,  // 2 automated compliance services
      advisory: 4  // 4 automated advisory services
    };
    
    const totalAutomated = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
    
    // Calculate proportional savings per category
    let monthly = 0;
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      const categoryCost = CPA_SERVICE_COSTS[category as keyof typeof CPA_SERVICE_COSTS];
      const proportion = count / totalAutomated;
      monthly += categoryCost * proportion;
    });
    
    setMonthlySavings(Math.round(monthly));
    setAnnualSavings(Math.round(monthly * 12));
  }, [automatedServicesCount]);
  
  const automationPercentage = Math.round((automatedServicesCount / totalServicesCount) * 100);
  
  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
      }}
    >
      <CardHeader style={{ padding: 'var(--spacing-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--success-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PiggyBank className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <CardTitle>CPA Cost Savings</CardTitle>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              Automated services vs. traditional CPA fees
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent style={{ padding: '0 var(--spacing-5) var(--spacing-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
          {/* Monthly Savings */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Monthly Savings
              </p>
            </div>
            <h2 style={{ color: 'var(--success)' }}>
              ${monthlySavings.toLocaleString()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              vs. hiring a CPA
            </p>
          </div>
          
          {/* Annual Savings */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Annual Savings
              </p>
            </div>
            <h2 style={{ color: 'var(--success)' }}>
              ${annualSavings.toLocaleString()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              per year saved
            </p>
          </div>
          
          {/* Automation Rate */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Automation Rate
              </p>
            </div>
            <h2 style={{ color: 'var(--primary)' }}>
              {automationPercentage}%
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              {automatedServicesCount} of {totalServicesCount} services
            </p>
          </div>
        </div>
        
        {/* Savings Breakdown */}
        <div 
          style={{ 
            marginTop: 'var(--spacing-5)',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <Calculator className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <h3>What You're Saving On</h3>
          </div>
          
          <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
            {[
              { service: 'Bookkeeping & Transaction Management', cost: 300, automated: 7, total: 7 },
              { service: 'Financial Statement Preparation', cost: 150, automated: 5, total: 5 },
              { service: 'Tax Preparation & Filing', cost: 200, automated: 5, total: 5 },
              { service: 'Financial Analysis & Planning', cost: 250, automated: 8, total: 8 },
              { service: 'Payroll Services', cost: 180, automated: 1, total: 4 },
              { service: 'Compliance & Audit Support', cost: 200, automated: 2, total: 4 },
              { service: 'Advisory & Strategic Services', cost: 400, automated: 4, total: 6 }
            ].map((item, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.automated === item.total ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flex: 1 }}>
                  {item.automated === item.total ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)', flexShrink: 0 }} />
                  ) : (
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: 'var(--radius-full)',
                        border: '2px solid var(--muted-foreground)',
                        flexShrink: 0
                      }} 
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                      {item.service}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                      {item.automated} of {item.total} automated
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 'var(--spacing-3)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--success)' }}>
                    ${Math.round((item.cost * item.automated) / item.total)}/mo
                  </p>
                  {item.automated === item.total && (
                    <Badge 
                      variant="outline" 
                      style={{ 
                        marginTop: 'var(--spacing-1)',
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        backgroundColor: 'var(--success-soft)',
                        color: 'var(--success)',
                        border: 'none'
                      }}
                    >
                      100%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ROI Message */}
        <div 
          style={{ 
            marginTop: 'var(--spacing-4)',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-soft)',
            border: '1px solid var(--primary)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <DollarSign className="w-5 h-5" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                <strong>Your ROI:</strong> With {automatedServicesCount} automated CPA services, you're saving an estimated 
                <strong style={{ color: 'var(--success)' }}> ${monthlySavings}/month</strong> compared to hiring a traditional CPA firm.
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
                These savings estimates are based on average CPA fees for small businesses. Actual savings may vary based on your location and business complexity.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
