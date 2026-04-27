import React from 'react';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface MarketingChatProps {
  user: any;
}

export function MarketingChat({ user }: MarketingChatProps) {
  return <UnifiedDepartmentChat user={user} department="marketing" />;
}
