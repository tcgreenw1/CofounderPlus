/**
 * Route Persistence Utility
 * Saves and restores the user's last visited route for better UX on page refresh
 * 
 * Usage:
 * - The useRouteTracking hook automatically saves routes as the user navigates
 * - On page refresh, the HomeRoute component checks for a saved route and redirects there
 * - Routes are automatically cleared on sign out via localStorage.clear()
 * - Certain routes (auth, onboarding, etc.) are excluded from persistence
 */

const LAST_ROUTE_KEY = 'cofounder_last_route';

// Routes that should NOT be persisted (we don't want to redirect back to these)
const EXCLUDED_ROUTES = [
  '/',
  '/auth',
  '/enhanced-auth',
  '/auth/callback',
  '/questionnaire',
  '/path-choice',
  '/business-info',
  '/personality-test',
  '/business-name',
  '/phone-signup-completion',
  '/admin-account-creator',
  '/billing/redirect',
  '/plaid/oauth/redirect',
  '/github/callback',
  '/hubspot/callback',
  '/salesforce/callback',
  '/google/callback',
  '/slack/callback',
  '/mobile-welcome',
  '/privacy-policy',
  '/terms-of-service',
  '/supported-businesses',
  '/jobs',
  '/about-us',
  '/help',
  '/founder-setup-call',
  '/book-founder-call',
];

/**
 * Save the current route to localStorage
 * @param path - The route path to save
 */
export function saveLastRoute(path: string): void {
  try {
    // Don't save if it's an excluded route
    if (isExcludedRoute(path)) {
      return;
    }

    // Don't save if it contains query params that indicate temporary state
    if (path.includes('from=')) {
      return;
    }

    // Save the route
    localStorage.setItem(LAST_ROUTE_KEY, path);
    console.log('📍 Route Persistence: Saved route:', path);
  } catch (error) {
    console.error('Route Persistence: Error saving route:', error);
  }
}

/**
 * Get the last saved route from localStorage
 * @returns The last saved route or null if none exists
 */
export function getLastRoute(): string | null {
  try {
    const lastRoute = localStorage.getItem(LAST_ROUTE_KEY);
    
    if (lastRoute && !isExcludedRoute(lastRoute)) {
      console.log('📍 Route Persistence: Retrieved saved route:', lastRoute);
      return lastRoute;
    }
    
    return null;
  } catch (error) {
    console.error('Route Persistence: Error retrieving route:', error);
    return null;
  }
}

/**
 * Clear the saved route from localStorage
 */
export function clearLastRoute(): void {
  try {
    localStorage.removeItem(LAST_ROUTE_KEY);
    console.log('📍 Route Persistence: Cleared saved route');
  } catch (error) {
    console.error('Route Persistence: Error clearing route:', error);
  }
}

/**
 * Check if a route should be excluded from persistence
 * @param path - The route path to check
 * @returns True if the route should be excluded
 */
function isExcludedRoute(path: string): boolean {
  // Check exact matches
  if (EXCLUDED_ROUTES.includes(path)) {
    return true;
  }

  // Check if the path starts with any excluded route (for nested routes)
  return EXCLUDED_ROUTES.some(excludedRoute => {
    // Only check prefix for routes that have a trailing segment indicator
    if (excludedRoute.endsWith('/')) {
      return path.startsWith(excludedRoute);
    }
    // For booking confirmation and other dynamic routes
    if (path.startsWith('/booking-confirmation/')) {
      return true;
    }
    return false;
  });
}