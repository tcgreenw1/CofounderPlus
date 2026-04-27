import React from 'react';

interface ZeroBusinessHandlerProps {
  children: React.ReactNode;
  user: any;
}

/**
 * ZeroBusinessHandler - DISABLED
 * This component previously redirected users with 0 businesses to /business-management.
 * It now simply passes through children without any business checking or redirects.
 */
export const ZeroBusinessHandler: React.FC<ZeroBusinessHandlerProps> = ({ children }) => {
  // Just render children - no business checking or redirects
  return <>{children}</>;
};
