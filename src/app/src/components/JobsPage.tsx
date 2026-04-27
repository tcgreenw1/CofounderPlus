import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Briefcase, GraduationCap, Scale, Calculator, TrendingUp, Users, ArrowRight, CheckCircle, X, Upload, FileText } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface JobsPageProps {
  user?: any;
}

interface JobListing {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  icon: React.ReactNode;
  badge?: string;
}

interface ApplicationFormData {
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  linkedIn: string;
  yearsOfExperience: string;
  currentRole: string;
  education: string;
  relevantExpertise: string;
  whyInterested: string;
  availability: string;
  resumeText: string;
}

function JobsPage({ user }: JobsPageProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    jobId: '',
    jobTitle: '',
    fullName: '',
    email: '',
    phone: '',
    linkedIn: '',
    yearsOfExperience: '',
    currentRole: '',
    education: '',
    relevantExpertise: '',
    whyInterested: '',
    availability: '',
    resumeText: ''
  });

  const jobs: JobListing[] = [
    {
      id: 'lawyer-ai-trainer',
      title: 'Legal Expert - AI Model Trainer',
      department: 'AI Training',
      type: 'Contract',
      location: 'Remote',
      description: 'Help train our AI models on legal concepts, compliance, contracts, and business law. Your expertise will shape how our tool understands and advises on legal matters for entrepreneurs.',
      requirements: [
        'J.D. from accredited law school',
        'Active bar membership in good standing',
        '3+ years of practice experience',
        'Strong background in business/corporate law',
        'Excellent written communication skills'
      ],
      responsibilities: [
        'Review and annotate legal content for AI training',
        'Provide expert feedback on AI-generated legal guidance',
        'Create training scenarios based on real-world legal situations',
        'Validate accuracy of legal information',
        'Collaborate with AI team to improve model responses'
      ],
      icon: <Scale className="size-6" />,
      badge: 'High Priority'
    },
    {
      id: 'accountant-ai-trainer',
      title: 'Accounting Expert - AI Model Trainer',
      department: 'AI Training',
      type: 'Contract',
      location: 'Remote',
      description: 'Train our AI to understand accounting principles, tax regulations, financial statements, and bookkeeping practices. Help entrepreneurs get accurate financial guidance.',
      requirements: [
        'CPA certification required',
        '5+ years of accounting experience',
        'Expertise in small business accounting',
        'Knowledge of tax preparation and planning',
        'Experience with various accounting software'
      ],
      responsibilities: [
        'Annotate financial scenarios for AI training',
        'Review AI-generated accounting advice for accuracy',
        'Develop training content for tax and bookkeeping',
        'Validate financial calculations and recommendations',
        'Help improve financial reporting features'
      ],
      icon: <Calculator className="size-6" />,
      badge: 'High Priority'
    },
    {
      id: 'marketing-strategist-ai-trainer',
      title: 'Marketing Strategist - AI Model Trainer',
      department: 'AI Training',
      type: 'Contract',
      location: 'Remote',
      description: 'Share your marketing expertise to train AI on advanced marketing strategies, digital campaigns, brand development, and growth tactics for businesses.',
      requirements: [
        'MBA or equivalent marketing degree',
        '7+ years in marketing leadership roles',
        'Proven track record of successful campaigns',
        'Expertise in digital marketing and analytics',
        'Strong understanding of brand strategy'
      ],
      responsibilities: [
        'Create marketing training scenarios and case studies',
        'Review AI-generated marketing strategies',
        'Provide expert guidance on campaign planning',
        'Validate marketing metrics and KPIs',
        'Help develop marketing automation features'
      ],
      icon: <TrendingUp className="size-6" />,
      badge: 'High Priority'
    },
    {
      id: 'hr-specialist-ai-trainer',
      title: 'HR Specialist - AI Model Trainer',
      department: 'AI Training',
      type: 'Contract',
      location: 'Remote',
      description: 'Train our AI on human resources best practices, employee management, hiring processes, and workplace compliance to help business owners build strong teams.',
      requirements: [
        'SHRM-CP or PHR certification preferred',
        '5+ years of HR experience',
        'Knowledge of employment law and compliance',
        'Experience with small to mid-size businesses',
        'Expertise in recruitment and employee development'
      ],
      responsibilities: [
        'Develop HR scenarios for AI training',
        'Review AI recommendations on HR matters',
        'Create training content for hiring and management',
        'Validate compliance and policy guidance',
        'Help improve employee management features'
      ],
      icon: <Users className="size-6" />
    },
    {
      id: 'business-consultant-ai-trainer',
      title: 'Business Consultant - AI Model Trainer',
      department: 'AI Training',
      type: 'Contract',
      location: 'Remote',
      description: 'Leverage your business consulting experience to train AI on strategy, operations, market analysis, and business planning for entrepreneurs at all stages.',
      requirements: [
        'MBA or relevant advanced degree',
        '8+ years of consulting experience',
        'Expertise across multiple business functions',
        'Experience with startups and small businesses',
        'Strong analytical and strategic thinking skills'
      ],
      responsibilities: [
        'Create comprehensive business scenarios',
        'Review AI-generated business strategies',
        'Provide guidance on business model development',
        'Validate operational recommendations',
        'Help improve strategic planning features'
      ],
      icon: <Briefcase className="size-6" />
    }
  ];

  const benefits = [
    'Flexible remote work schedule',
    'Competitive hourly compensation',
    'Shape the future of AI for entrepreneurs',
    'Work with cutting-edge AI technology',
    'Collaborate with diverse experts',
    'Make real impact on businesses worldwide'
  ];

  const handleApplyClick = (job: JobListing) => {
    setSelectedJob(job);
    setFormData({
      ...formData,
      jobId: job.id,
      jobTitle: job.title
    });
    setShowApplicationForm(true);
  };

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    setFormData({
      jobId: '',
      jobTitle: '',
      fullName: '',
      email: '',
      phone: '',
      linkedIn: '',
      yearsOfExperience: '',
      currentRole: '',
      education: '',
      relevantExpertise: '',
      whyInterested: '',
      availability: '',
      resumeText: ''
    });
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.relevantExpertise || !formData.whyInterested) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/job-applications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            submittedAt: new Date().toISOString()
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Application submitted successfully!');
        handleCloseForm();
      } else {
        toast.error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen starry-background transition-all duration-300"
      style={{ 
        background: theme === 'dark' 
          ? 'linear-gradient(to bottom right, rgb(10, 15, 30), rgb(20, 30, 50), rgb(15, 20, 35))' 
          : '#FFFFFF'
      }}
    >
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <Logo size="md" showText={true} />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base"
            style={{ color: 'var(--foreground)' }}
          >
            Back to Home
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl liquid-glass-nav"
          >
            {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <GraduationCap className="size-5" />
              <span className="font-medium">Train the Future of AI</span>
            </div>

            <h1 className="mb-6"
              style={{
                background: `linear-gradient(135deg, var(--primary), var(--accent))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Join Our AI Training Team
            </h1>

            <p className="text-lg sm:text-xl max-w-3xl mx-auto"
              style={{ color: 'var(--muted-foreground)' }}
            >
              We're seeking highly educated professionals to train our AI models. 
              Your expertise will directly shape how Cofounder+ helps entrepreneurs build and grow their businesses.
            </p>
          </div>

          {/* Why Join Section */}
          <Card className="p-6 sm:p-8 mb-12 border-2"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)'
            }}
          >
            <h2 className="mb-6 flex items-center gap-3">
              <Briefcase className="size-6" style={{ color: 'var(--primary)' }} />
              Why Join Cofounder+?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'var(--muted)' }}
                >
                  <CheckCircle className="size-5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--card-foreground)' }}>{benefit}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Open Positions */}
          <div className="mb-12">
            <h2 className="mb-8 text-center">Open Positions</h2>

            <div className="grid gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="p-6 sm:p-8 border-2 hover:shadow-lg transition-all duration-300"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    <div className="shrink-0 size-12 sm:size-16 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}
                    >
                      {job.icon}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3>{job.title}</h3>
                          {job.badge && (
                            <Badge style={{
                              background: 'var(--action)',
                              color: 'var(--action-foreground)'
                            }}>
                              {job.badge}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {job.department}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>•</span>
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {job.type}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>•</span>
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {job.location}
                          </span>
                        </div>

                        <p className="mb-4" style={{ color: 'var(--card-foreground)' }}>
                          {job.description}
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="mb-3" style={{ color: 'var(--card-foreground)' }}>Requirements</h4>
                          <ul className="space-y-2">
                            {job.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                <span style={{ color: 'var(--muted-foreground)' }}>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="mb-3" style={{ color: 'var(--card-foreground)' }}>Responsibilities</h4>
                          <ul className="space-y-2">
                            {job.responsibilities.slice(0, 5).map((resp, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <ArrowRight className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                                <span style={{ color: 'var(--muted-foreground)' }}>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={() => handleApplyClick(job)}
                          className="w-full sm:w-auto"
                          style={{
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)'
                          }}
                        >
                          Apply for This Position
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <Card className="p-6 sm:p-8 text-center border-2"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)'
            }}
          >
            <h3 className="mb-4">Don't See Your Role?</h3>
            <p className="mb-6 max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              We're always looking for talented professionals in various fields to help train our AI models. 
              If you have specialized expertise and are interested in contributing, we'd love to hear from you.
            </p>
            <Button
              onClick={() => {
                setSelectedJob({
                  id: 'general-application',
                  title: 'General AI Training Application',
                  department: 'AI Training',
                  type: 'Contract',
                  location: 'Remote',
                  description: 'General application for AI training positions',
                  requirements: [],
                  responsibilities: [],
                  icon: <Briefcase className="size-6" />
                });
                setFormData({
                  ...formData,
                  jobId: 'general-application',
                  jobTitle: 'General AI Training Application'
                });
                setShowApplicationForm(true);
              }}
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-foreground)'
              }}
            >
              Submit General Application
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Application Form Dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)'
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--card-foreground)' }}>
              Apply for {selectedJob?.title}
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Please fill out the application form below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitApplication} className="space-y-6 mt-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 style={{ color: 'var(--card-foreground)' }}>Personal Information</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" style={{ color: 'var(--card-foreground)' }}>
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="John Doe"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="email" style={{ color: 'var(--card-foreground)' }}>
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" style={{ color: 'var(--card-foreground)' }}>
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="linkedIn" style={{ color: 'var(--card-foreground)' }}>
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedIn"
                    type="url"
                    value={formData.linkedIn}
                    onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                    placeholder="https://linkedin.com/in/johndoe"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Professional Background */}
            <div className="space-y-4">
              <h4 style={{ color: 'var(--card-foreground)' }}>Professional Background</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearsOfExperience" style={{ color: 'var(--card-foreground)' }}>
                    Years of Experience
                  </Label>
                  <Input
                    id="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    placeholder="5 years"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="currentRole" style={{ color: 'var(--card-foreground)' }}>
                    Current Role/Title
                  </Label>
                  <Input
                    id="currentRole"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    placeholder="Senior Accountant"
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="education" style={{ color: 'var(--card-foreground)' }}>
                  Education & Certifications
                </Label>
                <Textarea
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="E.g., CPA, J.D. from Harvard Law, MBA from Stanford, etc."
                  rows={3}
                  style={{
                    background: 'var(--input-background)',
                    borderColor: 'var(--border)',
                    color: 'var(--card-foreground)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="relevantExpertise" style={{ color: 'var(--card-foreground)' }}>
                  Relevant Expertise *
                </Label>
                <Textarea
                  id="relevantExpertise"
                  value={formData.relevantExpertise}
                  onChange={(e) => setFormData({ ...formData, relevantExpertise: e.target.value })}
                  required
                  placeholder="Please describe your relevant expertise and how it relates to this position..."
                  rows={4}
                  style={{
                    background: 'var(--input-background)',
                    borderColor: 'var(--border)',
                    color: 'var(--card-foreground)'
                  }}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 style={{ color: 'var(--card-foreground)' }}>Additional Information</h4>
              
              <div>
                <Label htmlFor="whyInterested" style={{ color: 'var(--card-foreground)' }}>
                  Why are you interested in this position? *
                </Label>
                <Textarea
                  id="whyInterested"
                  value={formData.whyInterested}
                  onChange={(e) => setFormData({ ...formData, whyInterested: e.target.value })}
                  required
                  placeholder="Tell us what excites you about training AI models and working with Cofounder+..."
                  rows={4}
                  style={{
                    background: 'var(--input-background)',
                    borderColor: 'var(--border)',
                    color: 'var(--card-foreground)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="availability" style={{ color: 'var(--card-foreground)' }}>
                  Availability
                </Label>
                <Input
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  placeholder="E.g., 10-15 hours per week, available immediately"
                  style={{
                    background: 'var(--input-background)',
                    borderColor: 'var(--border)',
                    color: 'var(--card-foreground)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="resumeText" style={{ color: 'var(--card-foreground)' }}>
                  Resume/CV (paste text or summary)
                </Label>
                <Textarea
                  id="resumeText"
                  value={formData.resumeText}
                  onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                  placeholder="You can paste your resume text here or provide a brief summary of your professional experience..."
                  rows={6}
                  style={{
                    background: 'var(--input-background)',
                    borderColor: 'var(--border)',
                    color: 'var(--card-foreground)'
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                onClick={handleCloseForm}
                disabled={submitting}
                variant="outline"
                className="w-full sm:w-auto"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--card-foreground)'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            © 2024 Cofounder+. Building the future of entrepreneurship with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default JobsPage;
