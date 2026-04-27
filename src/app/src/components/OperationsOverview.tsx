import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Package, Megaphone, DollarSign, CreditCard, UserCheck,
  ArrowRight, TrendingUp, Sparkles, Activity, Briefcase
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CofounderInsightsSummary } from './operations/CofounderInsightsSummary';

interface OperationsOverviewProps {
  user: any;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const operationsModules = [
    {
      id: 'operations',
      title: 'Operations',
      description: 'Streamline operations for small businesses',
      icon: Briefcase,
      path: '/operations/department',
      color: 'from-orange-500/20 to-orange-600/20',
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      accentColor: 'bg-orange-500/10',
    },
    {
      id: 'product',
      title: 'Product Operations',
      description: 'Manage your products and services',
      icon: Package,
      path: '/operations/product',
      color: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accentColor: 'bg-purple-500/10',
    },
    {
      id: 'marketing',
      title: 'Marketing Operations',
      description: 'Campaigns, analytics, and growth',
      icon: Megaphone,
      path: '/operations/marketing',
      color: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-600 dark:text-green-400',
      accentColor: 'bg-green-500/10',
    },
    {
      id: 'sales',
      title: 'Sales Operations',
      description: 'Pipeline and customer management',
      icon: DollarSign,
      path: '/operations/sales',
      color: 'from-yellow-500/20 to-yellow-600/20',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      accentColor: 'bg-yellow-500/10',
    },
    {
      id: 'finance',
      title: 'Finance Operations',
      description: 'Budgets, expenses, and projections',
      icon: CreditCard,
      path: '/operations/finance',
      color: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accentColor: 'bg-blue-500/10',
    },
    {
      id: 'hr',
      title: 'Human Resources',
      description: 'Team management and growth',
      icon: UserCheck,
      path: '/operations/hr',
      color: 'from-red-500/20 to-red-600/20',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-600 dark:text-red-400',
      accentColor: 'bg-red-500/10',
    }
  ];

  return (
    <div 
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
        paddingLeft: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)',
        paddingRight: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 'var(--spacing-2)' }}
      >
        <h1 
          style={{ 
            marginBottom: 'var(--spacing-1)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          Business OS
        </h1>
        <p style={{ opacity: 0.7 }}>
          Manage all aspects of your business operations
        </p>
      </motion.div>

      {/* Cofounder Insights Summary */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CofounderInsightsSummary />
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div 
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ gap: 'var(--spacing-3)' }}
        >
          <Card 
            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div 
                  style={{
                    background: 'var(--primary-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>Active</p>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>5 Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div 
                  style={{
                    background: 'var(--success-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>Status</p>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Online</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div 
                  style={{
                    background: 'var(--primary-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>Analytics</p>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Live</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div 
                  style={{
                    background: 'var(--success-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>Team</p>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Operations Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ marginTop: 'var(--spacing-2)' }}
      >
        <h2 
          style={{ 
            marginBottom: 'var(--spacing-4)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          Departments
        </h2>
        
        <div 
          className="grid sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 'var(--spacing-4)' }}
        >
          {operationsModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + index * 0.05 }}
              >
                <Card 
                  onClick={() => navigate(module.path)}
                  className={`group cursor-pointer bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-300 ${module.borderColor}`}
                  style={{ 
                    borderRadius: 'var(--radius-2xl)',
                  }}
                >
                  <CardContent 
                    style={{ 
                      padding: 'var(--spacing-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--spacing-4)',
                    }}
                  >
                    {/* Icon and Title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'flex-start', flex: 1 }}>
                        <div 
                          className={`${module.accentColor}`}
                          style={{
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon className={`w-6 h-6 ${module.iconColor}`} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                            }}
                          >
                            {module.title}
                          </h3>
                          <p 
                            style={{ 
                              fontSize: '0.875rem',
                              opacity: 0.6,
                              lineHeight: '1.4',
                            }}
                          >
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight 
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                        style={{ flexShrink: 0, marginLeft: 'var(--spacing-2)' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Help Section */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginTop: 'var(--spacing-4)' }}
        >
          <Card 
            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <CardContent 
              style={{ 
                padding: 'var(--spacing-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-4)',
              }}
            >
              <div>
                <h3 
                  style={{ 
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Need Help Getting Started?
                </h3>
                <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  Each operations module includes guided tutorials and best practices to help you optimize your business processes.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/university')}
                className="bg-primary text-primary-foreground hover:opacity-90"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-3) var(--spacing-6)',
                  whiteSpace: 'nowrap',
                }}
              >
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default OperationsOverview;
