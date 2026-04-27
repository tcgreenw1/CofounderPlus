import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  MessageSquare, 
  Shield, 
  CheckCircle, 
  UserSquare2, 
  Zap,
  LayoutDashboard,
  FileCheck,
  Lock,
  Users,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Clock,
  Eye,
  Key,
  UserCheck,
  BadgeCheck,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useIsMobile } from '../ui/use-mobile';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';
import { FrontDeskAgent } from './FrontDeskAgent';
import { isIOS } from '../../utils/platformDetection';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ComingSoonOverlay } from './ComingSoonOverlay';
import { QuickActionsContent } from './QuickActionsContent';
import { VerificationsContent } from './VerificationsContent';
import { SecurityContent } from './SecurityContent';

interface OperationsDepartmentProps {
  user?: any;
}

export function OperationsDepartment({ user }: OperationsDepartmentProps) {
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  
  // Tab state with persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('operationsDepartment_activeTab');
    return saved || 'quick-actions';
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('operationsDepartment_activeTab', activeTab);
  }, [activeTab]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
    >
      {/* Operations Department Header */}
      <div style={{ position: 'relative' }}>
        <BusinessDropdownHeader
          title="Operations"
          description="Streamline operations for small businesses"
          icon={<Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
          accentColor="orange"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="grid w-full grid-cols-5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-1)',
            height: 'auto',
            ...(isMobile && {
              position: 'sticky',
              top: '0',
              zIndex: 10,
              marginBottom: 'var(--spacing-3)'
            })
          }}
        >
          <TabsTrigger 
            value="quick-actions" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-1"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Actions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-1"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Chat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="front-desk" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-1"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <UserSquare2 className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm text-center leading-tight">Front Desk</span>
          </TabsTrigger>
          <TabsTrigger 
            value="verifications" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-1"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm text-center leading-tight">Verify</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-1"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="mt-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ComingSoonOverlay>
              <QuickActionsContent />
            </ComingSoonOverlay>
          </motion.div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ComingSoonOverlay>
              <UnifiedDepartmentChat 
                department="operations" 
                placeholder="Ask about your business operations, procedures, or compliance..."
              />
            </ComingSoonOverlay>
          </motion.div>
        </TabsContent>

        {/* Front Desk Tab */}
        <TabsContent value="front-desk" className="mt-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ComingSoonOverlay>
              <FrontDeskAgent />
            </ComingSoonOverlay>
          </motion.div>
        </TabsContent>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="mt-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ComingSoonOverlay>
              <VerificationsContent />
            </ComingSoonOverlay>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ComingSoonOverlay>
              <SecurityContent />
            </ComingSoonOverlay>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}