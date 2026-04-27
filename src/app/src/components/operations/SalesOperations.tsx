import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { SalesOperationsPage } from './SalesOperationsPage';
import { useIsMobile } from '../ui/use-mobile';
import { isIOS } from '../../utils/platformDetection';

interface SalesOperationsProps {
  user?: any;
  userData?: any;
}

function SalesOperations({ user, userData }: SalesOperationsProps) {
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
        height: '100%',
      }}
    >
      {/* Header with Business Dropdown */}
      <BusinessDropdownHeader
        title="Sales"
        description="Your sales cofounder"
        icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
        accentColor="yellow"
      />

      {/* Comprehensive Sales Operations Page with all features */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SalesOperationsPage user={user} userData={userData} />
      </div>
    </motion.div>
  );
}

export default SalesOperations;