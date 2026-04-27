import React from 'react';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface SalesChatProps {
  user: any;
}

export function SalesChat({ user }: SalesChatProps) {
  return <UnifiedDepartmentChat user={user} department="sales" />;
}
