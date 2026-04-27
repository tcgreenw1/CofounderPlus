import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { BusinessSwitcher } from './BusinessSwitcher';
import { MotivationButton } from './MotivationButton';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { 
  Package, Megaphone, TrendingUp, DollarSign, Users, 
  ArrowLeft, Plus, BarChart3, Calendar, Target, Settings, ChevronLeft, Menu, X, LayoutGrid
} from 'lucide-react';
import ProductOperations from './operations/ProductOperations';
import MarketingOperations from './operations/MarketingOperations';
import SalesOperations from './operations/SalesOperations';
import FinanceOperations from './operations/FinanceOperationsNew';
import HumanResourcesOperations from './operations/HumanResourcesOperations';
import { isIOS } from '../utils/platformDetection';

interface OperationsHubProps {
  user: any;
  onBack: () => void;
}

function OperationsHub({ user, onBack }: OperationsHubProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [userData, setUserData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch finance data for the overview
  useEffect(() => {
    const fetchFinanceData = async () => {
      if (!selectedBusiness || !user) {
        console.log('OperationsHub: Skipping finance fetch -', { 
          hasBusinessId: !!selectedBusiness, 
          hasUser: !!user 
        });
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('OperationsHub: No session available for finance fetch');
          return;
        }

        console.log('OperationsHub: Fetching finance data for business:', selectedBusiness.id);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('OperationsHub: Finance data loaded successfully:', {
            transactions: data.transactions?.length || 0,
            invoices: data.invoices?.length || 0,
            budgets: data.budgets?.length || 0
          });
          setFinanceData(data);
        } else {
          const errorText = await response.text();
          console.error('Error fetching finance data for Business OS:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching finance data for Business OS:', error);
      }
    };

    fetchFinanceData();
  }, [selectedBusiness, user]);

  const operationsSections = [
    {
      id: 'product',
      title: 'Product',
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
      description: 'Manage products, inventory, and development',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />,
      description: 'Campaigns, content, and brand management',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'sales',
      title: 'Sales',
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
      description: 'CRM, pipeline, and customer management',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 'finance',
      title: 'Finance',
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
      description: 'Budget, expenses, and financial tracking',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    {
      id: 'human',
      title: 'Human Resources',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      description: 'Team management and hiring',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'product':
        return <ProductOperations user={user} userData={userData} />;
      case 'marketing':
        return <MarketingOperations user={user} userData={userData} />;
      case 'sales':
        return <SalesOperations user={user} userData={userData} />;
      case 'finance':
        return <FinanceOperations user={user} userData={userData} />;
      case 'human':
        return <HumanResourcesOperations user={user} userData={userData} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={isMobile ? 'space-y-2' : 'space-y-6 sm:space-y-8'}
    >
      {/* Welcome Section - Much more compact on mobile */}
      <div className={`text-center ${isMobile ? 'mb-1' : 'mb-8 sm:mb-12'}`}>
        {!isMobile && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
          >
            <LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>
        )}
        <h1 className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-lg mb-1' : 'text-3xl sm:text-4xl mb-3 sm:mb-4'}`}>
          Business OS
        </h1>
        {!isMobile && (
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Streamline your business operations with comprehensive tools for product, marketing, sales, finance, and HR management.
          </p>
        )}
      </div>

      {/* Quick Stats - More compact on mobile */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${isMobile ? 'gap-1.5 mb-2' : 'gap-3 sm:gap-6 mb-8 sm:mb-12'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 ${isMobile ? 'p-1.5' : 'p-4 sm:p-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className={`bg-green-500/20 rounded-xl ${isMobile ? 'p-1' : 'p-2 sm:p-3'}`}>
              <DollarSign className={`text-green-600 ${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>Income</p>
              <p className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xs' : 'text-lg sm:text-2xl'}`}>
                ${financeData?.transactions
                  ?.filter((t: any) => t.type === 'income')
                  ?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                  ?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 ${isMobile ? 'p-1.5' : 'p-4 sm:p-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className={`bg-red-500/20 rounded-xl ${isMobile ? 'p-1' : 'p-2 sm:p-3'}`}>
              <TrendingUp className={`text-red-600 ${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>Expenses</p>
              <p className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xs' : 'text-lg sm:text-2xl'}`}>
                ${financeData?.transactions
                  ?.filter((t: any) => t.type === 'expense')
                  ?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                  ?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 ${isMobile ? 'p-1.5' : 'p-4 sm:p-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className={`bg-orange-500/20 rounded-xl ${isMobile ? 'p-1' : 'p-2 sm:p-3'}`}>
              <BarChart3 className={`text-orange-600 ${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>Invoices</p>
              <p className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xs' : 'text-lg sm:text-2xl'}`}>
                ${financeData?.invoices
                  ?.filter((inv: any) => inv.status === 'pending')
                  ?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
                  ?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 ${isMobile ? 'p-1.5' : 'p-4 sm:p-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className={`bg-blue-500/20 rounded-xl ${isMobile ? 'p-1' : 'p-2 sm:p-3'}`}>
              <Target className={`text-blue-600 ${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>Budgets</p>
              <p className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xs' : 'text-lg sm:text-2xl'}`}>
                {financeData?.budgets?.length || 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Operations Sections Grid - 2 columns on mobile to save vertical space */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-1.5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}`}>
        {operationsSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 5) }}
            whileHover={!isMobile ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const paths = {
                'product': '/operations/product',
                'marketing': '/operations/marketing',
                'sales': '/operations/sales',
                'finance': '/operations/finance',
                'human': '/operations/hr'
              };
              navigate(paths[section.id as keyof typeof paths] || `/operations/${section.id}`);
            }}
            className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 cursor-pointer group ${isMobile ? 'p-2' : 'p-6 sm:p-8'}`}
          >
            <div className={`bg-gradient-to-r ${section.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${isMobile ? 'w-7 h-7 mb-1.5' : 'w-12 h-12 sm:w-16 sm:h-16 mb-4 sm:mb-6'}`}>
              <div className="text-white">
                {isMobile ? (
                  React.cloneElement(section.icon, { className: 'w-3.5 h-3.5' })
                ) : (
                  section.icon
                )}
              </div>
            </div>
            
            <h3 className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xs mb-0.5' : 'text-lg sm:text-xl mb-2 sm:mb-3'}`}>
              {section.title}
            </h3>
            
            {!isMobile && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-4 sm:mb-6">
                {section.description}
              </p>
            )}

            <div className={`flex items-center text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-300 ${isMobile ? 'text-[10px]' : ''}`}>
              <span className={`font-medium mr-1 ${isMobile ? 'text-[10px]' : 'text-sm sm:text-base'}`}>{isMobile ? 'Open' : `Open ${section.title}`}</span>
              <ArrowLeft className={`rotate-180 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  if (activeSection !== 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
        {/* Gentle meteors for operations */}
        <div className="shooting-star" style={{ animationDelay: '25s', animationDuration: '5.1s', top: '35%' }}></div>
        {/* Header */}
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-b border-white/30 dark:border-gray-700/30 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setActiveSection('overview')}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${operationsSections.find(s => s.id === activeSection)?.color} rounded-lg flex-shrink-0`}>
                <div className="text-white">
                  {operationsSections.find(s => s.id === activeSection)?.icon}
                </div>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
                {operationsSections.find(s => s.id === activeSection)?.title}
                <span className="hidden sm:inline"> Operations</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="p-4 sm:p-6"
          style={{
            paddingBottom: isIOS() 
              ? 'max(env(safe-area-inset-bottom, 0px) + 96px, 96px)' 
              : '24px'
          }}
        >
          <AnimatePresence mode="wait">
            {renderActiveSection()}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Gentle meteors for Business OS */}
      <div className="shooting-star" style={{ animationDelay: '32s', animationDuration: '4.7s', top: '28%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '68s', animationDuration: '5.3s', top: '65%' }}></div>
      {/* Header - compact on mobile */}
      <div className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-b border-white/30 dark:border-gray-700/30 ${isMobile ? 'px-2 py-2' : 'px-4 sm:px-6 py-3 sm:py-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onBack}
              className={`rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors ${isMobile ? 'p-1' : 'p-2'}`}
            >
              <ChevronLeft className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>
            <h1 className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-base' : 'text-lg sm:text-2xl'}`}>
              Business OS
            </h1>
          </div>
          
          {/* Hide some controls on mobile to save space */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isMobile && <MotivationButton variant="minimal" />}
            <BusinessSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        style={{
          padding: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)',
          paddingTop: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)',
          paddingBottom: isIOS() 
            ? 'max(env(safe-area-inset-bottom, 0px) + 96px, 96px)' 
            : '24px'
        }}
        className="sm:px-6"
      >
        {renderOverview()}
      </div>
    </div>
  );
}

export default OperationsHub;