import React from 'react';
import { CreatorPaywall } from './CreatorPaywall';
import { useCloudSubscription } from '../CloudSubscriptionContext';

interface OperationsWrapperProps {
  operationType: 'product' | 'marketing' | 'sales' | 'finance' | 'hr';
  onUpgrade?: () => void;
  user?: any; // Add user prop
  children: React.ReactNode;
}

export const OperationsWrapper: React.FC<OperationsWrapperProps> = ({
  operationType,
  onUpgrade,
  user,
  children
}) => {
  const { isCreatorOrHigher } = useCloudSubscription();

  return (
    <CreatorPaywall
      isCreatorOrHigher={isCreatorOrHigher}
      operationType={operationType}
      onUpgrade={onUpgrade || (() => {})}
      user={user}
    >
      {children}
    </CreatorPaywall>
  );
};