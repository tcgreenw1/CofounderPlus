import React, { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { MobileLayout } from './MobileLayout';
import DesktopLayout from './DesktopLayout';

interface ResponsiveLayoutProps {
  user: any;
  customServerAvailable?: boolean;
  children?: React.ReactNode;
}

// Memoized to prevent unnecessary re-renders during navigation
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = React.memo(({ 
  user, 
  customServerAvailable = true, 
  children 
}) => {
  // Start with desktop assumption to prevent mobile flash on desktop
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // CRITICAL FOR APPLE APP STORE REVIEW:
    // If running in iOS/Android Capacitor app, ALWAYS use mobile view
    // This prevents Apple Connect reviewers from seeing desktop view when they stretch the viewport
    const isNativeApp = Capacitor.isNativePlatform();
    
    if (isNativeApp) {
      // Force mobile view for native apps, regardless of screen size
      setIsMobile(true);
      setIsLandscape(false);
      return; // Don't set up resize listeners for native apps
    }

    // For browser/web: Continue with responsive behavior based on width
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const landscape = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsLandscape(landscape);
    };
    
    // Initial check
    checkMobile();
    
    // Debounced resize handler for better performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    
    // Listen for resize events with debouncing
    window.addEventListener('resize', debouncedCheck);
    // Also listen for orientation changes
    window.addEventListener('orientationchange', debouncedCheck);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedCheck);
      window.removeEventListener('orientationchange', debouncedCheck);
    };
  }, []);

  // Render mobile or desktop layout based on screen size
  // In landscape mode on mobile, show desktop layout with collapsed sidebar
  if (isMobile && !isLandscape) {
    return (
      <MobileLayout 
        user={user} 
        customServerAvailable={customServerAvailable}
      >
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout 
      user={user} 
      customServerAvailable={customServerAvailable}
      isLandscapeMode={isLandscape}
    >
      {children}
    </DesktopLayout>
  );
});

export default ResponsiveLayout;