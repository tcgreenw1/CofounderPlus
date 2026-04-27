import React from 'react';
import { UnifiedDepartmentChat } from './UnifiedDepartmentChat';

interface ProductChatProps {
  user: any;
}

export function ProductChat({ user }: ProductChatProps) {
  return <UnifiedDepartmentChat user={user} department="product" />;
}
