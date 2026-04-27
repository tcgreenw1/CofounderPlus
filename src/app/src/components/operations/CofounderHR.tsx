import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Building,
  Settings,
  ArrowRight,
  Brain,
  Zap,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  Heart,
  DollarSign,
  MessageSquare,
  BarChart3,
  Workflow,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { toast } from 'sonner@2.0.3';
import { useCredits } from '../../hooks/useCredits';

interface CofounderHRProps {
  user?: any;
  userData?: any;
}

interface Handbook {
  id: string;
  business_id: string;
  role_title: string;
  role_description: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  word_count: number;
  sections: string[];
}

interface Business {
  id: string;
  name: string;
  description?: string;
}

// Mock HR insights
const mockHRInsights = [
  {
    id: 1,
    type: 'hiring',
    title: 'Open Positions Detected',
    description: 'You have 3 job openings. Let me help create handbooks for these roles.',
    priority: 'high',
    timestamp: '5 minutes ago',
    action: 'Create Handbooks'
  },
  {
    id: 2,
    type: 'compliance',
    title: 'Handbook Update Recommended',
    description: 'New labor laws effective next month. I can update your handbooks automatically.',
    priority: 'medium',
    timestamp: '1 hour ago',
    action: 'Review Updates'
  },
  {
    id: 3,
    type: 'performance',
    title: 'Performance Review Season',
    description: 'Q4 reviews starting soon. Need help creating review templates?',
    priority: 'medium',
    timestamp: '2 hours ago',
    action: 'Generate Templates'
  }
];

const mockQuickActions = [
  {
    icon: BookOpen,
    label: 'Create Handbook',
    description: 'Generate employee handbook',
    color: '#6c5ce7',
    action: 'create_handbook'
  },
  {
    icon: Users,
    label: 'Onboarding Guide',
    description: 'New hire onboarding materials',
    color: '#0984e3',
    action: 'onboarding'
  },
  {
    icon: Shield,
    label: 'Policy Document',
    description: 'Company policies & procedures',
    color: '#00b894',
    action: 'policy'
  },
  {
    icon: Award,
    label: 'Review Template',
    description: 'Performance review forms',
    color: '#fd79a8',
    action: 'review'
  },
  {
    icon: Heart,
    label: 'Benefits Guide',
    description: 'Employee benefits overview',
    color: '#e17055',
    action: 'benefits'
  },
  {
    icon: Target,
    label: 'Job Description',
    description: 'Role descriptions & requirements',
    color: '#fdcb6e',
    action: 'job_description'
  }
];

const mockAICapabilities = [
  {
    title: 'Automatic Handbook Generation',
    description: 'Create comprehensive handbooks from role descriptions',
    icon: Brain,
    active: true
  },
  {
    title: 'Compliance Updates',
    description: 'Auto-update policies for legal compliance',
    icon: Shield,
    active: true
  },
  {
    title: 'Multi-Business Support',
    description: 'Manage handbooks across all your businesses',
    icon: Building,
    active: true
  },
  {
    title: 'Smart Expansion',
    description: 'AI expands sections with detailed content',
    icon: Sparkles,
    active: true
  },
  {
    title: 'Custom Templates',
    description: 'Industry-specific handbook templates',
    icon: FileText,
    active: true
  },
  {
    title: 'Version Control',
    description: 'Track changes and maintain history',
    icon: Clock,
    active: true
  }
];

export function CofounderHR({ user, userData }: CofounderHRProps) {
  const navigate = useNavigate();
  const { selectedBusiness, userBusinesses } = useBusiness();
  const { deductCredits, checkCredits } = useCredits();
  
  const [handbooks, setHandbooks] = useState<Handbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState<'role' | 'business' | 'generating' | 'complete'>('role');
  
  // Create handbook form state
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [needsBusinessDescription, setNeedsBusinessDescription] = useState(false);
  const [generatingHandbook, setGeneratingHandbook] = useState(false);

  useEffect(() => {
    loadHandbooks();
  }, [selectedBusiness]);

  // Set default business when dialog opens
  useEffect(() => {
    if (showCreateDialog && selectedBusiness && !selectedBusinessId) {
      setSelectedBusinessId(selectedBusiness.id);
    }
  }, [showCreateDialog, selectedBusiness]);

  const loadHandbooks = async () => {
    try {
      setLoading(true);
      
      if (!user || !selectedBusiness) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Load handbooks from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandbooks(data.handbooks || []);
      } else {
        console.log('Failed to load handbooks');
        setHandbooks([]);
      }
    } catch (error) {
      console.log('Error loading handbooks:', error);
      setHandbooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHandbook = () => {
    setShowCreateDialog(true);
    setCreateStep('role');
    setRoleTitle('');
    setRoleDescription('');
    setSelectedBusinessId(selectedBusiness?.id || '');
    setBusinessDescription(selectedBusiness?.description || '');
    setNeedsBusinessDescription(false);
  };

  const handleNextStep = async () => {
    if (createStep === 'role') {
      if (!roleTitle.trim() || !roleDescription.trim()) {
        toast.error('Please provide both role title and description');
        return;
      }
      
      // Check if we have business description
      const business = userBusinesses?.find(b => b.id === selectedBusinessId);
      if (!business?.description) {
        setNeedsBusinessDescription(true);
        setCreateStep('business');
      } else {
        setBusinessDescription(business.description);
        await generateHandbook();
      }
    } else if (createStep === 'business') {
      if (!businessDescription.trim()) {
        toast.error('Please provide a business description');
        return;
      }
      
      // Save business description
      await saveBusinessDescription();
      await generateHandbook();
    }
  };

  const saveBusinessDescription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${selectedBusinessId}/description`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: businessDescription })
        }
      );
    } catch (error) {
      console.log('Error saving business description:', error);
    }
  };

  const generateHandbook = async () => {
    // Check and deduct credits (8 credits for handbook generation)
    if (!checkCredits(8)) {
      setShowCreateDialog(false);
      return;
    }

    setCreateStep('generating');
    setGeneratingHandbook(true);

    try {
      // Deduct credits before API call
      const success = await deductCredits(8, 'Employee Handbook Generation');
      if (!success) {
        setGeneratingHandbook(false);
        setShowCreateDialog(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        setGeneratingHandbook(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusinessId,
            roleTitle,
            roleDescription,
            businessDescription
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCreateStep('complete');
        toast.success('Handbook generated successfully!');
        
        // Reload handbooks
        setTimeout(() => {
          loadHandbooks();
          setShowCreateDialog(false);
          navigate(`/operations/hr/handbook/${data.handbook.id}`);
        }, 2000);
      } else {
        toast.error('Failed to generate handbook');
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error generating handbook:', error);
      toast.error('Error generating handbook');
      setShowCreateDialog(false);
    } finally {
      setGeneratingHandbook(false);
    }
  };

  const handleDeleteHandbook = async (handbookId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/${handbookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        toast.success('Handbook deleted');
        loadHandbooks();
      }
    } catch (error) {
      console.error('Error deleting handbook:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-6)',
        marginTop: 'var(--spacing-6)',
      }}
    >
      {/* Hero Alert */}
      <Alert 
        className="border-none"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--spacing-6)',
        }}
      >
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
          style={{ gap: 'var(--spacing-4)' }}
        >
          <div className="flex items-start" style={{ gap: 'var(--spacing-4)' }}>
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 
                className="flex items-center"
                style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--spacing-2)',
                  gap: 'var(--spacing-2)',
                }}
              >
                Cofounder HR
                <Sparkles className="w-5 h-5" />
              </h3>
              <AlertDescription style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Your AI-powered HR team. Generate handbooks, manage policies, and streamline HR operations - all on autopilot.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/settings?tab=cofounder')}
            style={{
              background: 'white',
              color: '#667eea',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2) var(--spacing-4)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            <Settings className="w-4 h-4" style={{ marginRight: 'var(--spacing-2)' }} />
            Configure
          </Button>
        </div>
      </Alert>

      {/* Quick Actions Grid */}
      <div>
        <h3 
          style={{ 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          Quick Actions
        </h3>
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          style={{ gap: 'var(--spacing-3)' }}
        >
          {mockQuickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none"
                style={{
                  background: 'var(--background)',
                  borderRadius: 'var(--radius-xl)',
                }}
                onClick={() => {
                  if (action.action === 'create_handbook') {
                    handleCreateHandbook();
                  } else {
                    toast.info(`${action.label} coming soon!`);
                  }
                }}
              >
                <CardContent
                  className="flex flex-col items-center text-center"
                  style={{
                    padding: 'var(--spacing-4)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <div
                    style={{
                      background: `${action.color}15`,
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p 
                      style={{ 
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: 'var(--spacing-1)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {action.label}
                    </p>
                    <p 
                      style={{
                        opacity: 0.6,
                        fontSize: '0.75rem',
                      }}
                    >
                      {action.description}
                    </p>
                    <Badge
                      variant="secondary"
                      style={{
                        marginTop: 'var(--spacing-2)',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                      }}
                    >
                      10 credits
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div 
        className="grid lg:grid-cols-2"
        style={{ gap: 'var(--spacing-6)' }}
      >
        {/* HR Insights */}
        <Card
          className="border-none"
          style={{
            background: 'var(--background)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <CardHeader style={{ padding: 'var(--spacing-6)' }}>
            <CardTitle 
              className="flex items-center"
              style={{ gap: 'var(--spacing-2)' }}
            >
              <Brain className="w-5 h-5" />
              Smart HR Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for your team
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
            <div 
              className="flex flex-col"
              style={{ gap: 'var(--spacing-3)' }}
            >
              {mockHRInsights.map((insight) => (
                <motion.div
                  key={insight.id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <div 
                    className="flex items-start justify-between"
                    style={{ marginBottom: 'var(--spacing-2)' }}
                  >
                    <div className="flex-1">
                      <div 
                        className="flex items-center"
                        style={{ 
                          gap: 'var(--spacing-2)',
                          marginBottom: 'var(--spacing-1)',
                        }}
                      >
                        <span 
                          style={{ 
                            fontWeight: 'var(--font-weight-semibold)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {insight.title}
                        </span>
                        {insight.priority === 'high' && (
                          <Badge
                            className="border-none"
                            style={{
                              background: '#ff758720',
                              color: '#ff7875',
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              fontSize: '0.75rem',
                            }}
                          >
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <div 
                    className="flex items-center justify-between"
                    style={{ marginTop: 'var(--spacing-3)' }}
                  >
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                      {insight.timestamp}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{
                        padding: 'var(--spacing-1) var(--spacing-3)',
                        height: 'auto',
                        fontSize: '0.75rem',
                      }}
                    >
                      {insight.action}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* HR Handbooks */}
        <Card
          className="border-none"
          style={{
            background: 'var(--background)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <CardHeader style={{ padding: 'var(--spacing-6)' }}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle 
                  className="flex items-center"
                  style={{ gap: 'var(--spacing-2)' }}
                >
                  <BookOpen className="w-5 h-5" />
                  HR Handbooks
                </CardTitle>
                <CardDescription>
                  AI-generated employee handbooks
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleCreateHandbook}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  gap: 'var(--spacing-2)',
                }}
              >
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
            {loading ? (
              <div className="text-center py-8">
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Loading handbooks...</p>
              </div>
            ) : handbooks.length > 0 ? (
              <div 
                className="flex flex-col"
                style={{ gap: 'var(--spacing-3)' }}
              >
                {handbooks.map((handbook) => (
                  <div
                    key={handbook.id}
                    style={{
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-4)',
                    }}
                  >
                    <div 
                      className="flex items-start justify-between"
                      style={{ marginBottom: 'var(--spacing-2)' }}
                    >
                      <div className="flex-1">
                        <span 
                          style={{ 
                            fontWeight: 'var(--font-weight-semibold)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {handbook.role_title}
                        </span>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 'var(--spacing-1)' }}>
                          {handbook.word_count} words • {handbook.sections.length} sections
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-none"
                        style={{
                          background: handbook.status === 'published' ? '#00b89420' : '#667eea20',
                          color: handbook.status === 'published' ? '#00b894' : '#667eea',
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {handbook.status}
                      </Badge>
                    </div>
                    <div 
                      className="flex items-center justify-end"
                      style={{ marginTop: 'var(--spacing-3)', gap: 'var(--spacing-2)' }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/operations/hr/handbook/${handbook.id}`)}
                        style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          height: 'auto',
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/operations/hr/handbook/${handbook.id}?edit=true`)}
                        style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          height: 'auto',
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHandbook(handbook.id)}
                        style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          height: 'auto',
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: 'var(--spacing-3)' }}>No handbooks yet</p>
                <Button
                  size="sm"
                  onClick={handleCreateHandbook}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-4)',
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Handbook
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Capabilities */}
      <Card
        className="border-none"
        style={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <CardHeader style={{ padding: 'var(--spacing-6)' }}>
          <CardTitle 
            className="flex items-center"
            style={{ gap: 'var(--spacing-2)' }}
          >
            <Sparkles className="w-5 h-5" />
            AI HR Capabilities
          </CardTitle>
          <CardDescription>
            What your Cofounder can do for you automatically
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
          <div 
            className="grid sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--spacing-4)' }}
          >
            {mockAICapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <div 
                    className="flex items-start"
                    style={{ gap: 'var(--spacing-3)' }}
                  >
                    <div
                      style={{
                        background: 'var(--accent)',
                        borderRadius: 'var(--radius)',
                        padding: 'var(--spacing-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 
                        style={{ 
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--spacing-1)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {capability.title}
                      </h5>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {capability.description}
                      </p>
                      {capability.active && (
                        <Badge
                          variant="outline"
                          className="border-none mt-2"
                          style={{
                            background: '#00b89420',
                            color: '#00b894',
                            padding: 'var(--spacing-1) var(--spacing-2)',
                            fontSize: '0.75rem',
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Handbook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent 
          className="sm:max-w-[600px]"
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
              <Bot className="w-6 h-6" style={{ color: 'var(--primary)' }} />
              {createStep === 'role' && 'Tell me about the role'}
              {createStep === 'business' && 'About your business'}
              {createStep === 'generating' && 'Generating your handbook...'}
              {createStep === 'complete' && 'Handbook ready!'}
            </DialogTitle>
            <DialogDescription>
              {createStep === 'role' && "I'll create a comprehensive employee handbook based on this role."}
              {createStep === 'business' && "Help me understand your business to create a better handbook."}
              {createStep === 'generating' && "Please wait while I generate your handbook..."}
              {createStep === 'complete' && "Your handbook has been created successfully!"}
            </DialogDescription>
          </DialogHeader>

          {createStep === 'role' && (
            <div 
              className="flex flex-col"
              style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
            >
              <div>
                <Label htmlFor="role-title">Role Title</Label>
                <Input
                  id="role-title"
                  placeholder="e.g., Senior Software Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>

              <div>
                <Label htmlFor="role-description">Role Description</Label>
                <Textarea
                  id="role-description"
                  placeholder="Describe the responsibilities, requirements, and expectations for this role..."
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={6}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>

              <div>
                <Label htmlFor="business-select">Business</Label>
                <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                  <SelectTrigger 
                    id="business-select"
                    style={{ marginTop: 'var(--spacing-2)', width: '100%' }}
                  >
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {userBusinesses && userBusinesses.length > 0 ? (
                      userBusinesses.map((business: Business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectLabel 
                        style={{ 
                          padding: 'var(--spacing-3)', 
                          opacity: 0.6,
                          textAlign: 'center'
                        }}
                      >
                        No businesses found
                      </SelectLabel>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Alert style={{ background: 'var(--accent)', borderRadius: 'var(--radius-lg)' }}>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  I'll generate a complete handbook including company policies, role responsibilities, benefits, and more.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNextStep}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {createStep === 'business' && (
            <div 
              className="flex flex-col"
              style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}
            >
              <Alert style={{ background: '#fdcb6e20', borderRadius: 'var(--radius-lg)', borderColor: '#fdcb6e' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#fdcb6e' }} />
                <AlertDescription style={{ color: 'var(--foreground)' }}>
                  I need to know more about your business to create an accurate handbook.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="business-description">Business Description</Label>
                <Textarea
                  id="business-description"
                  placeholder="Describe what your business does, your industry, values, and culture..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={8}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 'var(--spacing-2)' }}>
                  This will be saved and used for future handbooks.
                </p>
              </div>

              <div className="flex justify-end" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => setCreateStep('role')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  Generate Handbook
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {createStep === 'generating' && (
            <div 
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-4)' }}
            >
              <div className="relative">
                <Bot className="w-16 h-16" style={{ color: 'var(--primary)' }} />
                <Sparkles 
                  className="w-6 h-6 absolute -top-1 -right-1 animate-pulse" 
                  style={{ color: '#fdcb6e' }} 
                />
              </div>
              <div>
                <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                  Creating your handbook...
                </h4>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                  I'm analyzing the role and generating comprehensive content
                </p>
              </div>
              <Progress value={66} className="w-full" />
              <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                This usually takes 10-15 seconds
              </div>
            </div>
          )}

          {createStep === 'complete' && (
            <div 
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-4)' }}
            >
              <div 
                style={{
                  background: '#00b89420',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--spacing-4)',
                }}
              >
                <CheckCircle className="w-12 h-12" style={{ color: '#00b894' }} />
              </div>
              <div>
                <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                  Handbook Created!
                </h4>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                  Redirecting you to edit and review...
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}