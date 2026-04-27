import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from './ui/use-mobile';
import Homepage from './Homepage';

interface MobileHomeRedirectProps {
  user: any;
  authError?: string | null;
  supabaseAvailable?: boolean;
  customServerAvailable?: boolean;
  isSigningOut?: boolean;
}

/**
 * Mobile Home Redirect Component
 * 
 * Automatically redirects mobile users to /mobile-welcome for app-like experience
 * Desktop users continue to see the regular homepage
 * 
 * Mobile detection: screen width < 768px
 */
export const MobileHomeRedirect: React.FC<MobileHomeRedirectProps> = ({
  user,
  authError,
  supabaseAvailable = true,
  customServerAvailable = true,
  isSigningOut = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Don't redirect if user is viewing legal pages (privacy/terms)
    const isLegalPage = location.pathname === '/privacy-policy' || 
                       location.pathname === '/terms-of-service' ||
                       location.pathname === '/terms';
    
    // Only redirect non-authenticated mobile users to welcome page
    // But skip redirect for legal pages
    if (isMobile && !user && !isSigningOut && !isLegalPage) {
      console.log('📱 Mobile detected - redirecting to /mobile-welcome');
      navigate('/mobile-welcome', { replace: true });
    }
  }, [isMobile, user, isSigningOut, location.pathname, navigate]);

  // For desktop or while checking, show homepage
  return (
    <Homepage 
      user={user} 
      authError={authError}
      supabaseAvailable={supabaseAvailable}
      customServerAvailable={customServerAvailable}
    />
  );
};