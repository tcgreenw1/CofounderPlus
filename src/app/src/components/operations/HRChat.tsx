import React from 'react';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface HRChatProps {
  user: any;
}

export function HRChat({ user }: HRChatProps) {
  return <UnifiedDepartmentChat user={user} department="hr" />;
}
