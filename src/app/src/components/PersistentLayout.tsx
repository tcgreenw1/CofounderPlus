import React from 'react';
import { Outlet } from 'react-router-dom';
import ResponsiveLayout from './ResponsiveLayout';

interface PersistentLayoutProps {
  user: any;
  customServerAvailable?: boolean;
}

/**
 * PersistentLayout - A wrapper that keeps ResponsiveLayout mounted across navigation
 * This prevents the navigation menu from flickering when switching pages
 */
export const PersistentLayout: React.FC<PersistentLayoutProps> = ({ 
  user, 
  customServerAvailable = true 
}) => {
  return (
    <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
      <Outlet />
    </ResponsiveLayout>
  );
};
