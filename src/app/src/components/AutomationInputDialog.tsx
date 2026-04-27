/**
 * Automation Input Dialog
 * Gathers specific context from users before running automations
 * Uses design system CSS variables for consistent styling
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';

interface AutomationInputDialogProps {
  open: boolean;
  onClose: () => void;
  automationId: string;
  automationTitle: string;
  onSubmit: (data: Record<string, any>) => void;
  isLoading: boolean;
}

export function AutomationInputDialog({
  open,
  onClose,
  automationId,
  automationTitle,
  onSubmit,
  isLoading
}: AutomationInputDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Render different forms based on automation type
  const renderForm = () => {
    switch (automationId) {
      case 'product-research-analysis':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Product/Service Name</Label>
              <Input
                id="product"
                placeholder="e.g., Cloud-based CRM Software"
                value={formData.product || ''}
                onChange={(e) => updateField('product', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="targetMarket">Target Market</Label>
              <Input
                id="targetMarket"
                placeholder="e.g., Small to mid-size B2B SaaS companies"
                value={formData.targetMarket || ''}
                onChange={(e) => updateField('targetMarket', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="competitors">Known Competitors (comma-separated)</Label>
              <Input
                id="competitors"
                placeholder="e.g., Salesforce, HubSpot, Pipedrive"
                value={formData.competitors || ''}
                onChange={(e) => updateField('competitors', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="researchFocus">Specific Research Questions</Label>
              <Textarea
                id="researchFocus"
                placeholder="What specific aspects do you want to research? (e.g., pricing strategies, market size, customer pain points)"
                value={formData.researchFocus || ''}
                onChange={(e) => updateField('researchFocus', e.target.value)}
                rows={3}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'feature-prioritization':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="features">Features to Prioritize (one per line)</Label>
              <Textarea
                id="features"
                placeholder="List features you want prioritized, one per line&#10;e.g.,&#10;- Email integration&#10;- Mobile app&#10;- Advanced analytics dashboard"
                value={formData.features || ''}
                onChange={(e) => updateField('features', e.target.value)}
                rows={6}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="businessGoals">Current Business Goals</Label>
              <Textarea
                id="businessGoals"
                placeholder="What are your top business objectives? (e.g., increase user retention, expand to enterprise market)"
                value={formData.businessGoals || ''}
                onChange={(e) => updateField('businessGoals', e.target.value)}
                rows={3}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'user-feedback-analysis':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback">User Feedback to Analyze</Label>
              <Textarea
                id="feedback"
                placeholder="Paste user feedback, reviews, support tickets, or comments you want analyzed..."
                value={formData.feedback || ''}
                onChange={(e) => updateField('feedback', e.target.value)}
                rows={8}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="analysisType">What insights are you looking for?</Label>
              <Input
                id="analysisType"
                placeholder="e.g., Feature requests, pain points, sentiment trends"
                value={formData.analysisType || ''}
                onChange={(e) => updateField('analysisType', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'lead-scoring':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="leads">Leads to Score (one per line)</Label>
              <Textarea
                id="leads"
                placeholder="List leads with details, one per line&#10;e.g.,&#10;- Acme Corp, Enterprise, $50k budget, 3 meetings&#10;- StartupXYZ, Startup, $5k budget, 1 demo"
                value={formData.leads || ''}
                onChange={(e) => updateField('leads', e.target.value)}
                rows={6}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="idealCustomer">Ideal Customer Profile</Label>
              <Textarea
                id="idealCustomer"
                placeholder="Describe your ideal customer (industry, company size, budget range, etc.)"
                value={formData.idealCustomer || ''}
                onChange={(e) => updateField('idealCustomer', e.target.value)}
                rows={3}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'sales-insights':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipeline">Current Pipeline (one deal per line)</Label>
              <Textarea
                id="pipeline"
                placeholder="List deals in your pipeline&#10;e.g.,&#10;- Acme Corp, $50k, 80% probability, Closes Dec 15&#10;- Beta Inc, $25k, 50% probability, Closes Jan 10"
                value={formData.pipeline || ''}
                onChange={(e) => updateField('pipeline', e.target.value)}
                rows={6}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="timeframe">Forecast Timeframe</Label>
              <Input
                id="timeframe"
                placeholder="e.g., Next quarter, Next 90 days, This month"
                value={formData.timeframe || ''}
                onChange={(e) => updateField('timeframe', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'followup-reminders':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="leads">Leads Requiring Follow-up</Label>
              <Textarea
                id="leads"
                placeholder="List leads and last contact date&#10;e.g.,&#10;- John at Acme Corp, Last contact: Nov 15&#10;- Sarah at Beta Inc, Last contact: Oct 20"
                value={formData.leads || ''}
                onChange={(e) => updateField('leads', e.target.value)}
                rows={5}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'campaign-strategy':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign">Campaign Goal</Label>
              <Input
                id="campaign"
                placeholder="e.g., Launch new product feature, Increase brand awareness"
                value={formData.campaign || ''}
                onChange={(e) => updateField('campaign', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., B2B SaaS founders with 10-50 employees"
                value={formData.targetAudience || ''}
                onChange={(e) => updateField('targetAudience', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="budget">Budget Range</Label>
              <Input
                id="budget"
                placeholder="e.g., $5,000 - $10,000"
                value={formData.budget || ''}
                onChange={(e) => updateField('budget', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="channels">Preferred Marketing Channels</Label>
              <Input
                id="channels"
                placeholder="e.g., LinkedIn, Email, Content Marketing"
                value={formData.channels || ''}
                onChange={(e) => updateField('channels', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'content-ideas':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topics">Content Topics/Themes</Label>
              <Input
                id="topics"
                placeholder="e.g., SaaS growth strategies, Product management tips"
                value={formData.topics || ''}
                onChange={(e) => updateField('topics', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Input
                id="contentType"
                placeholder="e.g., Blog posts, LinkedIn posts, Email newsletters"
                value={formData.contentType || ''}
                onChange={(e) => updateField('contentType', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Who are you creating content for?"
                value={formData.targetAudience || ''}
                onChange={(e) => updateField('targetAudience', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'expense-categorization':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="expenses">Expenses to Categorize (one per line)</Label>
              <Textarea
                id="expenses"
                placeholder="List expenses&#10;e.g.,&#10;- Amazon Web Services, $450&#10;- Office supplies, $120&#10;- Client lunch, $85"
                value={formData.expenses || ''}
                onChange={(e) => updateField('expenses', e.target.value)}
                rows={6}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'cash-flow-forecast':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="revenue">Expected Monthly Revenue</Label>
              <Input
                id="revenue"
                placeholder="e.g., $25,000"
                value={formData.revenue || ''}
                onChange={(e) => updateField('revenue', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="expenses">Expected Monthly Expenses</Label>
              <Input
                id="expenses"
                placeholder="e.g., $18,000"
                value={formData.expenses || ''}
                onChange={(e) => updateField('expenses', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="runway">Current Cash on Hand</Label>
              <Input
                id="runway"
                placeholder="e.g., $50,000"
                value={formData.runway || ''}
                onChange={(e) => updateField('runway', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="forecastPeriod">Forecast Period</Label>
              <Input
                id="forecastPeriod"
                placeholder="e.g., Next 6 months, Q1 2025"
                value={formData.forecastPeriod || ''}
                onChange={(e) => updateField('forecastPeriod', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'invoice-generation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="e.g., Acme Corporation"
                value={formData.clientName || ''}
                onChange={(e) => updateField('clientName', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="services">Services/Items (one per line)</Label>
              <Textarea
                id="services"
                placeholder="List services with amounts&#10;e.g.,&#10;- Website Design, $5,000&#10;- SEO Optimization, $1,500&#10;- Monthly Maintenance, $500"
                value={formData.services || ''}
                onChange={(e) => updateField('services', e.target.value)}
                rows={5}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => updateField('dueDate', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'handbook-updates':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="section">Handbook Section to Update</Label>
              <Input
                id="section"
                placeholder="e.g., Remote Work Policy, Benefits, Code of Conduct"
                value={formData.section || ''}
                onChange={(e) => updateField('section', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="changes">What needs to be updated?</Label>
              <Textarea
                id="changes"
                placeholder="Describe what changes need to be made or what new content should be added..."
                value={formData.changes || ''}
                onChange={(e) => updateField('changes', e.target.value)}
                rows={5}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'onboarding-materials':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Hire Role</Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer, Sales Representative"
                value={formData.role || ''}
                onChange={(e) => updateField('role', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => updateField('startDate', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="department">Department/Team</Label>
              <Input
                id="department"
                placeholder="e.g., Engineering, Sales, Marketing"
                value={formData.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      case 'task-creation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="context">What do you need tasks for?</Label>
              <Textarea
                id="context"
                placeholder="Describe the project or goal&#10;e.g., Launch new marketing campaign for Q1, Prepare for investor pitch"
                value={formData.context || ''}
                onChange={(e) => updateField('context', e.target.value)}
                rows={4}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input
                id="timeframe"
                placeholder="e.g., This week, By end of month, Next quarter"
                value={formData.timeframe || ''}
                onChange={(e) => updateField('timeframe', e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                placeholder="Provide any relevant information for this automation..."
                value={formData.context || ''}
                onChange={(e) => updateField('context', e.target.value)}
                rows={6}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{automationTitle}</DialogTitle>
          <DialogDescription>
            Provide specific information to get the most accurate results from this automation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {renderForm()}

          <DialogFooter style={{ marginTop: 'var(--spacing-6)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" style={{ marginRight: 'var(--spacing-2)' }} />
                  Running...
                </>
              ) : (
                'Run Automation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
