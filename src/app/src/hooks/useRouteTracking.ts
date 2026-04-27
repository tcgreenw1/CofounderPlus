import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { saveLastRoute } from '../utils/routePersistence';

/**
 * Custom hook to automatically track and save route changes
 * This allows the app to restore the user's last visited page on refresh
 */
export function useRouteTracking(isAuthenticated: boolean) {
  const location = useLocation();

  useEffect(() => {
    // Only track routes for authenticated users
    if (!isAuthenticated) {
      return;
    }

    // Save the current route whenever it changes
    const fullPath = location.pathname + location.search;
    saveLastRoute(fullPath);
  }, [location.pathname, location.search, isAuthenticated]);
}
