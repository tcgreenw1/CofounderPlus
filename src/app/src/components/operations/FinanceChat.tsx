import React from 'react';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface FinanceChatProps {
  user: any;
}

export function FinanceChat({ user }: FinanceChatProps) {
  return <UnifiedDepartmentChat user={user} department="finance" />;
}
