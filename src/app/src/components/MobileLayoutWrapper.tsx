import React, { useEffect } from 'react';
import { useIsMobile } from './ui/use-mobile';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
}

export const MobileLayoutWrapper: React.FC<MobileLayoutWrapperProps> = ({ children }) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    const body = document.body;
    if (isMobile) {
      body.classList.add('mobile-layout');
    } else {
      body.classList.remove('mobile-layout');
    }

    // Cleanup on unmount
    return () => {
      body.classList.remove('mobile-layout');
    };
  }, [isMobile]);

  return <>{children}</>;
};

export default MobileLayoutWrapper;