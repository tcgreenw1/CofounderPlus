import React, { useState, useEffect, useCallback } from 'react';
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
  Shield,
  Heart,
  Award,
  Target,
  MessageSquare,
  Info,
  AlertCircle,
  Loader2,
  UserPlus,
  ClipboardCheck,
  Calendar,
  Send,
  Search,
  DollarSign,
  MapPin,
  Briefcase,
  Download,
  Zap,
  Save
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { toast } from 'sonner@2.0.3';
import { useCredits } from '../../hooks/useCredits';
import { HRChat } from './HRChat';
import { ContractorResearchDialog } from './ContractorResearchDialog';

interface CofounderHRProps {
  user?: any;
  userData?: any;
}

interface HRDocument {
  id: string;
  business_id: string;
  document_type: string;
  title: string;
  content: string;
  aiSummary?: string;
  metadata?: any;
  created_at: string;
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
}

interface Business {
  id: string;
  name: string;
  description?: string;
}

// Quick actions configuration
const quickActions = [
  {
    id: 'employee-handbook',
    label: 'Employee Handbook',
    icon: BookOpen,
    color: '#6c5ce7',
    description: 'Comprehensive employee handbook'
  },
  {
    id: 'offer-letter',
    label: 'Offer Letter',
    icon: FileText,
    color: '#0984e3',
    description: 'Professional job offer template'
  },
  {
    id: 'employment-contract',
    label: 'Employment Contract',
    icon: Shield,
    color: '#00b894',
    description: 'Legal employment agreement'
  },
  {
    id: 'performance-review',
    label: 'Performance Review',
    icon: Award,
    color: '#fd79a8',
    description: 'Employee evaluation template'
  },
  {
    id: 'job-description',
    label: 'Job Description',
    icon: Briefcase,
    color: '#fdcb6e',
    description: 'Detailed role requirements'
  },
  {
    id: 'policy-document',
    label: 'Policy Document',
    icon: Shield,
    color: '#e17055',
    description: 'Company policy template'
  },
  {
    id: 'onboarding-checklist',
    label: 'Onboarding Checklist',
    icon: ClipboardCheck,
    color: '#00b894',
    description: 'New hire onboarding guide'
  },
  {
    id: 'termination-letter',
    label: 'Termination Letter',
    icon: FileText,
    color: '#d63031',
    description: 'Professional termination notice'
  },
  {
    id: 'nda-agreement',
    label: 'NDA Agreement',
    icon: Shield,
    color: '#2d3436',
    description: 'Non-disclosure agreement'
  }
];

export function CofounderHRNew({ user, userData }: CofounderHRProps) {
  const navigate = useNavigate();
  const { selectedBusiness, userBusinesses } = useBusiness();
  const { deductCredits, checkCredits } = useCredits();
  
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Header */}
      <div>
        <h2>HR Cofounder</h2>
        <p style={{ opacity: 0.6, marginTop: 'var(--spacing-2)' }}>
          Chat with your HR Cofounder for personalized assistance
        </p>
      </div>

      {/* Chat Interface */}
      <HRChat user={user} />
    </div>
  );
}