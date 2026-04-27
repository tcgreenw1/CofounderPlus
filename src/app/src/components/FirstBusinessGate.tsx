import React, { useState, useEffect } from 'react';
import { useBusiness } from './BusinessContext';
import { BusinessOnboarding } from './BusinessOnboarding';
import { LoadingSpinner } from './LoadingSpinner';
import { MesmerizingLoader } from './MesmerizingLoader';

interface FirstBusinessGateProps {
  user: any;
  children: React.ReactNode;
  bypassBusinessCheck?: boolean; // For testing/admin purposes
}

export const FirstBusinessGate: React.FC<FirstBusinessGateProps> = ({ 
  user, 
  children,
  bypassBusinessCheck = false
}) => {
  const { 
    userBusinesses, 
    isLoading, 
    hasLoadingError, 
    isServerAvailable 
  } = useBusiness();
  
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  console.log('FirstBusinessGate: User:', user?.email, 'Mobile:', isMobile, 'Businesses:', userBusinesses.length, 'Loading:', isLoading, 'Bypass:', bypassBusinessCheck);

  // Bypass check if requested (for testing/admin)
  if (bypassBusinessCheck) {
    return <>{children}</>;
  }

  // Don't block if not authenticated
  if (!user) {
    return <>{children}</>;
  }

  // Don't block on desktop - let users use the app normally
  // The OperationsGate will handle business creation for operations pages specifically
  if (!isMobile) {
    return <>{children}</>;
  }

  // Still loading businesses - show mesmerizing loader
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <MesmerizingLoader message="Syncing your empire..." />
      </div>
    );
  }

  // Server error - let them through with error state (they can retry later)
  if (hasLoadingError && !isServerAvailable) {
    console.log('FirstBusinessGate: Server error, allowing access with error state');
    return <>{children}</>;
  }

  // User has no businesses and we're on mobile and server is available - show onboarding
  if (userBusinesses.length === 0 && isServerAvailable) {
    console.log('FirstBusinessGate: No businesses found on mobile, showing onboarding');
    return <BusinessOnboarding user={user} />;
  }

  // User has businesses or other conditions met - show main app
  return <>{children}</>;
};