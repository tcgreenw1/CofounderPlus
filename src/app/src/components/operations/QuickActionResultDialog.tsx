import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';

interface QuickActionResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    title: string;
    category: string;
    content: any;
  } | null;
}

export function QuickActionResultDialog({ open, onOpenChange, result }: QuickActionResultDialogProps) {
  if (!result) return null;

  const { title, category, content } = result;

  const renderContent = () => {
    // Quarterly Tax Estimate
    if (content.quarter) {
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
            }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              {content.quarter}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Income</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  ${parseFloat(content.income).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Expenses</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--destructive)' }}>
                  ${parseFloat(content.expenses).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Net Income</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  ${parseFloat(content.netIncome).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Est. Tax (25%)</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                  ${parseFloat(content.estimatedTax).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              💡 <strong>Note:</strong> {content.note}
            </p>
          </div>
        </div>
      );
    }

    // Tax Deductions
    if (content.deductions) {
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--success-soft)',
              border: '1px solid var(--success)',
            }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              Total Potential Deductions
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
              ${parseFloat(content.totalDeductions).toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            {content.deductions.map((deduction: any, idx: number) => (
              <div 
                key={idx}
                style={{ 
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p style={{ fontWeight: 600 }}>{deduction.category}</p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {deduction.count} transaction{deduction.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)' }}>
                    ${deduction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              💡 <strong>Note:</strong> {content.note}
            </p>
          </div>
        </div>
      );
    }

    // Profitability Analysis
    if (content.profitMargin !== undefined) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div 
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--success-soft)',
                border: '1px solid var(--success)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                Total Income
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                ${parseFloat(content.totalIncome).toLocaleString()}
              </p>
            </div>
            <div 
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--destructive-soft)',
                border: '1px solid var(--destructive)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                Total Expenses
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--destructive)' }}>
                ${parseFloat(content.totalExpenses).toLocaleString()}
              </p>
            </div>
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-1)' }}>Net Profit</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Status: {content.status}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: '2rem', fontWeight: 700, color: parseFloat(content.netProfit) >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                  ${parseFloat(content.netProfit).toLocaleString()}
                </p>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  {content.profitMargin}% margin
                </p>
              </div>
            </div>
          </div>
          {content.topExpenses && content.topExpenses.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
                Top Expense Categories
              </h4>
              <div className="space-y-2">
                {content.topExpenses.map((expense: any, idx: number) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <p style={{ fontWeight: 600 }}>{expense.category}</p>
                      <p style={{ fontWeight: 700, color: 'var(--destructive)' }}>
                        ${expense.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Cash Flow Review
    if (content.period) {
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {content.period}
            </p>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 'var(--spacing-1)' }}>
              Cash Flow Health: {content.health}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Trend: {content.trend}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--success-soft)',
                border: '1px solid var(--success)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cash In</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                ${parseFloat(content.cashIn).toLocaleString()}
              </p>
            </div>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--destructive-soft)',
                border: '1px solid var(--destructive)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cash Out</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--destructive)' }}>
                ${parseFloat(content.cashOut).toLocaleString()}
              </p>
            </div>
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Net Cash Flow</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: parseFloat(content.netCashFlow) >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                  ${parseFloat(content.netCashFlow).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Current Balance</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  ${parseFloat(content.currentBalance).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Expense Optimization
    if (content.opportunities) {
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--warning-soft)',
              border: '1px solid var(--warning)',
            }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-1)' }}>
              Potential Annual Savings
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
              ${parseFloat(content.totalPotentialSavings).toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Based on 10% reduction in top expense categories
            </p>
          </div>
          <div className="space-y-2">
            {content.opportunities.map((opp: any, idx: number) => (
              <div 
                key={idx}
                style={{ 
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <p style={{ fontWeight: 600 }}>{opp.category}</p>
                  <p style={{ fontWeight: 700, color: 'var(--destructive)' }}>
                    ${opp.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    {opp.count} transactions · Avg ${opp.avgTransaction.toFixed(2)}
                  </p>
                  <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                    Save ~${opp.potentialSavings.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              💡 <strong>Tip:</strong> {content.note}
            </p>
          </div>
        </div>
      );
    }

    // Reconciliation Check
    if (content.calculatedBalance !== undefined) {
      const isBalanced = content.status === 'Balanced';
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isBalanced ? 'var(--success-soft)' : 'var(--warning-soft)',
              border: `1px solid ${isBalanced ? 'var(--success)' : 'var(--warning)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>
              {isBalanced ? '✅' : '⚠️'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: isBalanced ? 'var(--success)' : 'var(--warning)' }}>
              {content.status}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Calculated Balance</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                ${parseFloat(content.calculatedBalance).toLocaleString()}
              </p>
            </div>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Recorded Balance</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                ${parseFloat(content.recordedBalance).toLocaleString()}
              </p>
            </div>
          </div>
          {!isBalanced && (
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--warning-soft)',
                border: '1px solid var(--warning)',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-1)' }}>
                Difference: ${parseFloat(content.difference).toLocaleString()}
              </p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {content.note}
              </p>
            </div>
          )}
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p style={{ color: 'var(--muted-foreground)' }}>Total Transactions</p>
                <p style={{ fontWeight: 700 }}>{content.totalTransactions}</p>
              </div>
              <div>
                <p style={{ color: 'var(--muted-foreground)' }}>Uncategorized</p>
                <p style={{ fontWeight: 700, color: content.uncategorized > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {content.uncategorized}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Financial Statements
    if (content.profitLoss && content.balanceSheet) {
      return (
        <div className="space-y-4">
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-3)', fontSize: '1.125rem' }}>
              Profit & Loss Statement - {content.period}
            </h3>
            <div 
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--muted-foreground)' }}>Revenue</p>
                  <p style={{ fontWeight: 700, color: 'var(--success)' }}>
                    ${parseFloat(content.profitLoss.revenue).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--muted-foreground)' }}>Expenses</p>
                  <p style={{ fontWeight: 700, color: 'var(--destructive)' }}>
                    (${parseFloat(content.profitLoss.expenses).toLocaleString()})
                  </p>
                </div>
                <div 
                  className="flex justify-between items-center pt-3"
                  style={{ borderTop: '2px solid var(--border)' }}
                >
                  <p style={{ fontWeight: 700 }}>Net Income</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: parseFloat(content.profitLoss.netIncome) >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                    ${parseFloat(content.profitLoss.netIncome).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-3)', fontSize: '1.125rem' }}>
              Balance Sheet
            </h3>
            <div 
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--muted-foreground)' }}>Assets</p>
                  <p style={{ fontWeight: 700 }}>
                    ${parseFloat(content.balanceSheet.assets).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--muted-foreground)' }}>Liabilities</p>
                  <p style={{ fontWeight: 700 }}>
                    ${parseFloat(content.balanceSheet.liabilities).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="flex justify-between items-center pt-3"
                  style={{ borderTop: '2px solid var(--border)' }}
                >
                  <p style={{ fontWeight: 700 }}>Equity</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ${parseFloat(content.balanceSheet.equity).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              💡 <strong>Note:</strong> {content.note}
            </p>
          </div>
        </div>
      );
    }

    // Business Health Check
    if (content.healthScore !== undefined) {
      const getScoreColor = (score: number) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--primary)';
        if (score >= 40) return 'var(--warning)';
        return 'var(--destructive)';
      };
      
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              Overall Health Score
            </h3>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={getScoreColor(content.healthScore)}
                  strokeWidth="10"
                  strokeDasharray={`${(content.healthScore / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(content.healthScore) }}>
                  {content.healthScore}
                </p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {content.rating}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Profit Margin</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {content.profitMargin}%
              </p>
            </div>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cash Balance</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                ${parseFloat(content.currentBalance).toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              Recommendations
            </h4>
            <div className="space-y-2">
              {content.recommendations.map((rec: string, idx: number) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    • {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Compliance Check
    if (content.complianceScore !== undefined) {
      const getComplianceColor = (score: number) => {
        if (score >= 90) return 'var(--success)';
        if (score >= 70) return 'var(--warning)';
        return 'var(--destructive)';
      };
      
      return (
        <div className="space-y-3">
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: content.complianceScore >= 90 ? 'var(--success-soft)' : content.complianceScore >= 70 ? 'var(--warning-soft)' : 'var(--destructive-soft)',
              border: `1px solid ${getComplianceColor(content.complianceScore)}`,
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              Compliance Score
            </h3>
            <p style={{ fontSize: '3rem', fontWeight: 700, color: getComplianceColor(content.complianceScore) }}>
              {content.complianceScore}%
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              {content.status}
            </p>
          </div>
          {content.issues && content.issues.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
                Issues Found
              </h4>
              <div className="space-y-2">
                {content.issues.map((issue: string, idx: number) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--destructive-soft)',
                      border: '1px solid var(--destructive)',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                      ⚠️ {issue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
              Recommendations
            </h4>
            <div className="space-y-2">
              {content.recommendations.map((rec: string, idx: number) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    • {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2"
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--foreground)',
            }}
          >
            <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            {title}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
            {category}
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className="space-y-4 pt-4"
          style={{ padding: 'var(--spacing-4) 0' }}
        >
          {renderContent()}
        </div>
        
        <div 
          className="flex justify-end pt-4"
          style={{ 
            borderTop: '1px solid var(--border)',
            marginTop: 'var(--spacing-4)',
            paddingTop: 'var(--spacing-4)',
          }}
        >
          <Button 
            onClick={() => onOpenChange(false)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-2) var(--spacing-4)',
            }}
            className="hover:opacity-90"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
