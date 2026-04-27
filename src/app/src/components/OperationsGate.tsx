import React from 'react';
import { useBusiness } from './BusinessContext';
import { BusinessOnboarding } from './BusinessOnboarding';
import { LoadingSpinner } from './LoadingSpinner';
import { MesmerizingLoader } from './MesmerizingLoader';

interface OperationsGateProps {
  user: any;
  children: React.ReactNode;
}

export const OperationsGate: React.FC<OperationsGateProps> = ({ 
  user, 
  children 
}) => {
  const { 
    userBusinesses, 
    isLoading, 
    hasLoadingError, 
    isServerAvailable 
  } = useBusiness();

  console.log('OperationsGate: User:', user?.email, 'Businesses:', userBusinesses.length, 'Loading:', isLoading);

  // Don't block if not authenticated
  if (!user) {
    return <>{children}</>;
  }

  // Still loading businesses - show mesmerizing loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background flex items-center justify-center">
        <MesmerizingLoader message="Syncing your empire..." />
      </div>
    );
  }

  // Server error - let them through with error state (they can retry later)
  if (hasLoadingError && !isServerAvailable) {
    console.log('OperationsGate: Server error, allowing access with error state');
    return <>{children}</>;
  }

  // User has no businesses and server is available - show onboarding
  if (userBusinesses.length === 0 && isServerAvailable) {
    console.log('OperationsGate: No businesses found, showing business creation onboarding for operations access');
    return <BusinessOnboarding user={user} />;
  }

  // User has businesses - allow access to operations
  return <>{children}</>;
};