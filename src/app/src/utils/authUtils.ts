/**
 * Authentication utility functions
 */

// Helper function to check if user is admin
export const isAdminUser = (user: any): boolean => {
  const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
  const userEmail = user?.email;
  return adminEmails.includes(userEmail);
};

// Helper function to check if we should skip redirect
export const shouldSkipRedirect = (currentPath: string): boolean => {
  // Don't redirect if user is on specific pages that should persist
  const noRedirectPaths = [
    '/profile',
    '/security',
    '/settings',
    '/admin',
    '/dashboard',
    '/roadmap',
    '/operations',
    '/community',
    '/notes'
  ];
  
  return noRedirectPaths.some(path => currentPath.startsWith(path));
};

// Helper function to check if we're on an entry page
export const isEntryPage = (currentPath: string): boolean => {
  return currentPath === '/' || currentPath === '/auth' || currentPath === '/login';
};