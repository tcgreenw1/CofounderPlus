import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Search,
  DollarSign,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  ArrowRight,
  Info,
  Globe,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

interface ContractorResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResearchStep = 'role' | 'budget' | 'timeline' | 'location' | 'requirements' | 'analyzing' | 'results';

export function ContractorResearchDialog({ open, onOpenChange }: ContractorResearchDialogProps) {
  const [currentStep, setCurrentStep] = useState<ResearchStep>('role');
  
  // Form state
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetType, setBudgetType] = useState<'hourly' | 'project' | 'flexible'>('hourly');
  const [timeline, setTimeline] = useState('');
  const [urgency, setUrgency] = useState<'asap' | 'flexible' | 'planned'>('flexible');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'remote' | 'local' | 'hybrid'>('remote');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const handleNext = () => {
    const steps: ResearchStep[] = ['role', 'budget', 'timeline', 'location', 'requirements', 'analyzing', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      
      // Auto-advance from analyzing to results after 3 seconds
      if (steps[currentIndex + 1] === 'analyzing') {
        setTimeout(() => {
          setCurrentStep('results');
        }, 3000);
      }
    }
  };

  const handleBack = () => {
    const steps: ResearchStep[] = ['role', 'budget', 'timeline', 'location', 'requirements'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleClose = () => {
    setCurrentStep('role');
    setRoleTitle('');
    setRoleDescription('');
    setSkills('');
    setBudget('');
    setTimeline('');
    setLocation('');
    setAdditionalRequirements('');
    onOpenChange(false);
  };

  const getStepProgress = () => {
    const steps: ResearchStep[] = ['role', 'budget', 'timeline', 'location', 'requirements', 'analyzing', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--background)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center"
            style={{ gap: 'var(--spacing-2)' }}
          >
            <Search className="w-6 h-6" style={{ color: '#0984e3' }} />
            {currentStep === 'role' && 'What type of contractor do you need?'}
            {currentStep === 'budget' && 'What\'s your budget?'}
            {currentStep === 'timeline' && 'When do you need them?'}
            {currentStep === 'location' && 'Location preferences?'}
            {currentStep === 'requirements' && 'Any other requirements?'}
            {currentStep === 'analyzing' && 'Researching contractors...'}
            {currentStep === 'results' && 'Here\'s what I found'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'role' && 'Let me understand the role so I can find the perfect contractor for you.'}
            {currentStep === 'budget' && 'This helps me recommend contractors within your price range.'}
            {currentStep === 'timeline' && 'I\'ll find contractors based on your timeline needs.'}
            {currentStep === 'location' && 'Location can affect availability and rates.'}
            {currentStep === 'requirements' && 'Any specific skills, certifications, or preferences?'}
            {currentStep === 'analyzing' && 'Analyzing the best platforms, rates, and contractors for your needs...'}
            {currentStep === 'results' && 'Based on your requirements, here are my recommendations.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={getStepProgress()} className="w-full" style={{ height: '6px' }} />

        {/* Step 1: Role */}
        {currentStep === 'role' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="role-title">Role/Position Title</Label>
              <Input
                id="role-title"
                placeholder="e.g., Senior React Developer, Graphic Designer, Content Writer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>

            <div>
              <Label htmlFor="role-description">What will they be doing?</Label>
              <Textarea
                id="role-description"
                placeholder="Describe the project or ongoing work they'll be responsible for..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={4}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>

            <div>
              <Label htmlFor="skills">Key Skills Required</Label>
              <Input
                id="skills"
                placeholder="e.g., React, TypeScript, Figma, SEO"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
              <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 'var(--spacing-1)' }}>
                Separate multiple skills with commas
              </p>
            </div>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!roleTitle.trim() || !roleDescription.trim()}
                style={{
                  background: roleTitle.trim() && roleDescription.trim() ? '#0984e3' : undefined,
                  color: roleTitle.trim() && roleDescription.trim() ? 'white' : undefined,
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {currentStep === 'budget' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="budget-type">Payment Structure</Label>
              <Select value={budgetType} onValueChange={(value) => setBudgetType(value as any)}>
                <SelectTrigger 
                  id="budget-type"
                  style={{ marginTop: 'var(--spacing-2)' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="project">Fixed Project Price</SelectItem>
                  <SelectItem value="flexible">I'm Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">
                {budgetType === 'hourly' ? 'Hourly Rate Range' : budgetType === 'project' ? 'Total Project Budget' : 'Estimated Budget'}
              </Label>
              <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                <DollarSign className="w-5 h-5" style={{ opacity: 0.5 }} />
                <Input
                  id="budget"
                  placeholder={budgetType === 'hourly' ? 'e.g., $50-100/hr' : 'e.g., $5,000'}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <Alert style={{ background: 'rgba(9, 132, 227, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(9, 132, 227, 0.2)' }}>
              <Info className="w-4 h-4" style={{ color: '#0984e3' }} />
              <AlertDescription style={{ color: 'var(--foreground)' }}>
                <strong>Tip:</strong> I'll show you average market rates for this role to help you set competitive pricing.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!budget.trim()}
                style={{
                  background: budget.trim() ? '#0984e3' : undefined,
                  color: budget.trim() ? 'white' : undefined,
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Timeline */}
        {currentStep === 'timeline' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="urgency">How urgently do you need them?</Label>
              <Select value={urgency} onValueChange={(value) => setUrgency(value as any)}>
                <SelectTrigger 
                  id="urgency"
                  style={{ marginTop: 'var(--spacing-2)' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP (Within 1 week)</SelectItem>
                  <SelectItem value="flexible">Flexible (Within 2-4 weeks)</SelectItem>
                  <SelectItem value="planned">Planning Ahead (1+ months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeline">Project Duration</Label>
              <Input
                id="timeline"
                placeholder="e.g., 3 months, Ongoing, One-time project"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>

            <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
              <Clock className="w-5 h-5 mt-1" style={{ color: '#0984e3' }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-1)' }}>
                  Expected Response Time
                </p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  {urgency === 'asap' && 'You can typically get responses within 24-48 hours on most platforms.'}
                  {urgency === 'flexible' && 'Most contractors respond within 2-3 days for flexible timelines.'}
                  {urgency === 'planned' && 'For planned projects, you have time to review multiple proposals.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!timeline.trim()}
                style={{
                  background: timeline.trim() ? '#0984e3' : undefined,
                  color: timeline.trim() ? 'white' : undefined,
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {currentStep === 'location' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="location-type">Work Location</Label>
              <Select value={locationType} onValueChange={(value) => setLocationType(value as any)}>
                <SelectTrigger 
                  id="location-type"
                  style={{ marginTop: 'var(--spacing-2)' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Fully Remote</SelectItem>
                  <SelectItem value="local">Local/In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(locationType === 'local' || locationType === 'hybrid') && (
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                  <MapPin className="w-5 h-5" style={{ opacity: 0.5 }} />
                  <Input
                    id="location"
                    placeholder="City, State or Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div 
              className="grid grid-cols-2 gap-3"
              style={{ marginTop: 'var(--spacing-2)' }}
            >
              <div
                style={{
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-4)',
                }}
              >
                <Globe className="w-6 h-6 mb-2" style={{ color: '#0984e3' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                  Worldwide Talent
                </p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  Access to global contractor pool with competitive rates
                </p>
              </div>
              <div
                style={{
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-4)',
                }}
              >
                <Zap className="w-6 h-6 mb-2" style={{ color: '#fdcb6e' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                  Time Zone Match
                </p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  I'll prioritize contractors in compatible time zones
                </p>
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                style={{
                  background: '#0984e3',
                  color: 'white',
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Additional Requirements */}
        {currentStep === 'requirements' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="additional-requirements">Additional Requirements (Optional)</Label>
              <Textarea
                id="additional-requirements"
                placeholder="e.g., Must have experience with our industry, need portfolio, prefer someone who has worked with startups before..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                rows={5}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>

            <Alert style={{ background: 'rgba(0, 184, 148, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0, 184, 148, 0.2)' }}>
              <CheckCircle className="w-4 h-4" style={{ color: '#00b894' }} />
              <AlertDescription style={{ color: 'var(--foreground)' }}>
                Great! I have everything I need. Click "Analyze" and I'll research the best platforms, expected rates, and timelines for your contractor needs.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                style={{
                  gap: 'var(--spacing-2)',
                  boxShadow: '0 4px 12px rgba(9, 132, 227, 0.3)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Analyze & Research
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Analyzing */}
        {currentStep === 'analyzing' && (
          <div 
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-4)' }}
          >
            <div className="relative">
              <Bot className="w-16 h-16" style={{ color: '#0984e3' }} />
              <Sparkles 
                className="w-6 h-6 absolute -top-1 -right-1 animate-pulse" 
                style={{ color: '#fdcb6e' }} 
              />
            </div>
            <div>
              <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                Analyzing contractor market...
              </h4>
              <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                Researching platforms, rates, and availability for {roleTitle}
              </p>
            </div>
            <Progress value={75} className="w-full" />
            <div 
              className="flex flex-col"
              style={{ fontSize: '0.75rem', opacity: 0.5, gap: 'var(--spacing-1)' }}
            >
              <p>✓ Analyzing hiring platforms</p>
              <p>✓ Calculating market rates</p>
              <p>✓ Estimating response times</p>
              <p className="animate-pulse">⏳ Generating recommendations...</p>
            </div>
          </div>
        )}

        {/* Step 7: Results */}
        {currentStep === 'results' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--spacing-5)', marginTop: 'var(--spacing-4)' }}
          >
            {/* Summary Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(9, 132, 227, 0.1), rgba(9, 132, 227, 0.05))',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-5)',
                border: '1px solid rgba(9, 132, 227, 0.2)',
              }}
            >
              <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }}>
                Research Summary: {roleTitle}
              </h4>
              <div 
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 'var(--spacing-1)' }}>
                    Expected Rate
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 'var(--font-weight-semibold)' }}>
                    ${budgetType === 'hourly' ? '45-85/hr' : '3,500-8,000'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 'var(--spacing-1)' }}>
                    Time to Hire
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 'var(--font-weight-semibold)' }}>
                    {urgency === 'asap' ? '1-3 days' : urgency === 'flexible' ? '1-2 weeks' : '2-4 weeks'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Platforms */}
            <div>
              <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-3)', fontSize: '0.875rem' }}>
                Recommended Hiring Platforms
              </h5>
              <div 
                className="flex flex-col"
                style={{ gap: 'var(--spacing-3)' }}
              >
                {[
                  { name: 'Upwork', best: 'Large talent pool', rate: '$$-$$$', match: 95 },
                  { name: 'Toptal', best: 'Vetted top talent', rate: '$$$-$$$$', match: 88 },
                  { name: 'Fiverr', best: 'Quick turnaround', rate: '$-$$', match: 75 },
                  { name: 'We Work Remotely', best: 'Remote specialists', rate: '$$-$$$', match: 82 }
                ].map((platform, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <p style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.875rem' }}>
                          {platform.name}
                        </p>
                        <Badge
                          style={{
                            background: `rgba(0, 184, 148, ${platform.match / 100})`,
                            color: '#00b894',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                          }}
                        >
                          {platform.match}% match
                        </Badge>
                      </div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        Best for: {platform.best} • {platform.rate}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        padding: 'var(--spacing-1) var(--spacing-3)',
                        fontSize: '0.75rem',
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <Alert style={{ background: 'var(--accent)', borderRadius: 'var(--radius-lg)' }}>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>Next Steps:</strong> Post your job on 2-3 platforms to maximize responses. Most contractors respond within 24-48 hours.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Could implement saving research or creating a job post
                  handleClose();
                }}
                style={{
                  background: '#0984e3',
                  color: 'white',
                }}
              >
                Save Research
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
