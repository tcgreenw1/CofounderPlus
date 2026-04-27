import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Homepage from './Homepage';
import ResponsiveLayout from './ResponsiveLayout';

// Protected route component for regular dashboard that redirects admins
export const ProtectedDashboard = ({ 
  user, 
  userData, 
  customServerAvailable = true 
}: { 
  user: any; 
  userData: any; 
  customServerAvailable?: boolean;
}) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is admin based on Supabase auth user object, not userData
    const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
    const isAdminEmail = user?.email && adminEmails.includes(user.email);
    
    if (isAdminEmail) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Don't render dashboard if user is admin
  const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
  const isAdminEmail = user?.email && adminEmails.includes(user.email);
  
  if (isAdminEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ResponsiveLayout 
      user={user} 
      customServerAvailable={customServerAvailable}
    >
      <Dashboard user={user} customServerAvailable={customServerAvailable} />
    </ResponsiveLayout>
  );
};

// Protected homepage component that redirects logged-in users
export const ProtectedHomepage = ({ user, userData }: { user: any; userData: any }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect if user exists
    if (user) {
      // Check if URL has a hash route that should be preserved (e.g., #/pricing from external link)
      const currentHash = window.location.hash;
      if (currentHash && currentHash !== '#/' && currentHash !== '#') {
        // User came with a specific hash route, don't redirect
        console.log('🔗 ProtectedHomepage: Preserving hash route:', currentHash);
        return;
      }

      // Check if this is an admin email using Supabase auth user object
      const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
      const isAdminEmail = user.email && adminEmails.includes(user.email);
      
      if (isAdminEmail) {
        // Admin users go to admin dashboard
        navigate('/admin');
      } else {
        // Regular users go to regular dashboard
        navigate('/dashboard');
      }
    }
    // If no user, stay on homepage to show login button
  }, [user, navigate]);

  // Always render the homepage - let the useEffect handle redirects
  return <Homepage user={user} />;
};