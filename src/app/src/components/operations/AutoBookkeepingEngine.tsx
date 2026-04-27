import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  Download,
  Settings,
  Play,
  Clock,
  DollarSign,
  Tag,
  Target,
  RefreshCw,
  Filter,
  ListChecks
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { CategorizationRules } from './CategorizationRules';
import { MonthlyClose } from './MonthlyClose';
import { TaxPrep } from './TaxPrep';
import { ExportsCenter } from './ExportsCenter';
import { BookkeepingOverview } from './BookkeepingOverview';
import { CPAServicesChat } from './CPAServicesChat';
import { useIsMobile } from '../ui/use-mobile';

interface AutoBookkeepingEngineProps {
  user: any;
}

interface StatusLog {
  id: string;
  date_time: string;
  action: string;
  agi_summary: string;
  affected_records: number;
  status: 'success' | 'error' | 'in_progress';
  created_at: string;
}

export function AutoBookkeepingEngine({ user }: AutoBookkeepingEngineProps) {
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    uncategorized: 0,
    accuracy: 0,
    monthlyCloseStatus: 'pending',
    quarterlyTaxes: 0,
    lastExport: null as string | null
  });
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Load status logs
  useEffect(() => {
    if (selectedBusiness) {
      loadStatusLogs();
      loadStats();
    }
  }, [selectedBusiness]);

  const loadStatusLogs = async () => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/status-logs?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setStatusLogs(data.logs || []);
        }
      }
    } catch (error) {
      console.error('Failed to load status logs:', error);
    }
  };

  const loadStats = async () => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/stats?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setStats(data.stats || stats);
        }
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const runFullAutoBookkeeping = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setIsRunning(true);
    setShowAIPanel(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsRunning(false);
        return;
      }

      console.log('🔧 Running full auto-bookkeeping...', {
        businessId: selectedBusiness.id,
        userId: user?.id
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/bookkeeping/run-full`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            userId: user?.id
          })
        }
      );

      console.log('🔧 Auto-bookkeeping response status:', response.status);

      const contentType = response.headers.get('content-type');
      
      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ Auto-bookkeeping success:', data);
          toast.success('Auto-bookkeeping completed successfully!');
        } else {
          const text = await response.text();
          console.log('✅ Auto-bookkeeping success (non-JSON):', text);
          toast.success('Auto-bookkeeping completed successfully!');
        }
        loadStatusLogs();
        loadStats();
      } else {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Auto-bookkeeping error:', errorData);
          toast.error(errorData.error || 'Failed to run auto-bookkeeping');
        } else {
          const errorText = await response.text();
          console.error('❌ Auto-bookkeeping error (non-JSON):', errorText);
          toast.error(`Failed to run auto-bookkeeping: ${errorText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.error('❌ Auto-bookkeeping error:', error);
      toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left Sidebar - Mobile: Horizontal scroll tabs, Desktop: Vertical sidebar */}
      <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Mobile: Horizontal tabs */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
            <Sparkles className="w-4 h-4 text-[#00E0FF] flex-shrink-0" />
            <h2 className="text-sm font-semibold whitespace-nowrap">Auto-Bookkeeping Engine</h2>
          </div>
          <nav className="flex overflow-x-auto px-2 py-2 gap-1">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('overview')}
            >
              <Target className="w-3 h-3 mr-1" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'categorization' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('categorization')}
            >
              <Tag className="w-3 h-3 mr-1" />
              Rules
            </Button>
            <Button
              variant={activeTab === 'monthly-close' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('monthly-close')}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Close
            </Button>
            <Button
              variant={activeTab === 'tax-prep' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('tax-prep')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Tax
            </Button>
            <Button
              variant={activeTab === 'exports' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('exports')}
            >
              <Download className="w-3 h-3 mr-1" />
              Exports
            </Button>
            <Button
              variant={activeTab === 'cpa-chat' ? 'default' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setActiveTab('cpa-chat')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              CPA Services
            </Button>
          </nav>
        </div>

        {/* Desktop: Vertical sidebar */}
        <div className="hidden md:block p-4 h-full overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#00E0FF]" />
              <h2 className="font-semibold">Auto-Bookkeeping Engine</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI-powered financial automation with Cofounder AGI
            </p>
          </div>

          <nav className="space-y-1">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('overview')}
            >
              <Target className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'categorization' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('categorization')}
            >
              <Tag className="w-4 h-4 mr-2" />
              Categorization Rules
            </Button>
            <Button
              variant={activeTab === 'monthly-close' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('monthly-close')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Monthly Close
            </Button>
            <Button
              variant={activeTab === 'tax-prep' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('tax-prep')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Tax Prep
            </Button>
            <Button
              variant={activeTab === 'exports' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('exports')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exports Center
            </Button>
            <Button
              variant={activeTab === 'cpa-chat' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('cpa-chat')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              CPA Services Chat
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 min-w-0">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <BookkeepingOverview
            user={user}
            stats={stats}
            statusLogs={statusLogs}
            isRunning={isRunning}
            runFullAutoBookkeeping={runFullAutoBookkeeping}
            getStatusColor={getStatusColor}
          />
        )}

        {/* Categorization Rules Tab */}
        {activeTab === 'categorization' && (
          <CategorizationRules user={user} />
        )}

        {/* Monthly Close Tab */}
        {activeTab === 'monthly-close' && (
          <MonthlyClose user={user} />
        )}

        {/* Tax Prep Tab */}
        {activeTab === 'tax-prep' && (
          <TaxPrep user={user} />
        )}

        {/* Exports Tab */}
        {activeTab === 'exports' && (
          <ExportsCenter user={user} />
        )}

        {/* CPA Services Chat Tab */}
        {activeTab === 'cpa-chat' && (
          <div style={{
            ...(isMobile && {
              height: 'calc(100dvh - 200px)', 
              maxHeight: 'calc(100dvh - 200px)',
              overflow: 'hidden'
            })
          }}>
            <CPAServicesChat user={user} />
          </div>
        )}
      </div>

      {/* Cofounder AGI Panel (anchored to bottom-right on desktop, full-width bottom on mobile) */}
      {showAIPanel && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-2xl border-t sm:border border-gray-200 dark:border-gray-700 z-50 max-h-[60vh] sm:max-h-[500px] flex flex-col">
          <div className="bg-gradient-to-r from-[#00E0FF] to-[#4B00FF] p-3 sm:p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                <h3 className="text-sm sm:text-base font-semibold text-white">Cofounder AGI</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIPanel(false)}
                className="text-white hover:bg-white/20 h-6 w-6 sm:h-8 sm:w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
            {isRunning ? (
              <>
                <div className="flex items-start gap-2 sm:gap-3 animate-fadeIn">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00E0FF] mt-1 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium">🔍 Analyzing transactions...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reviewing uncategorized transactions and applying intelligent categorization rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 animate-fadeIn">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00E0FF] mt-1 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium">📊 Generating reports...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Creating tax-ready financial summaries and compliance reports
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 animate-fadeIn">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00E0FF] mt-1 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium">✅ Updating bookkeeping status...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Synchronizing all changes and updating monthly close progress
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-[#00E0FF] opacity-50" />
                <p className="text-xs sm:text-sm font-medium">Cofounder AGI Ready</p>
                <p className="text-xs mt-1">Run auto-bookkeeping to start intelligent automation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}