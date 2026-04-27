import React from 'react';
import ResponsiveLayout from './ResponsiveLayout';

interface UnifiedNavigationProps {
  user: any;
  customServerAvailable?: boolean;
  isMobile?: boolean;
  children?: React.ReactNode;
}

export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = React.memo(({ 
  user, 
  customServerAvailable = true, 
  isMobile = false,
  children 
}) => {
  return (
    <ResponsiveLayout 
      user={user} 
      customServerAvailable={customServerAvailable}
    >
      {children}
    </ResponsiveLayout>
  );
});

UnifiedNavigation.displayName = 'UnifiedNavigation';

export default UnifiedNavigation;