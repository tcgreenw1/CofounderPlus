import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { fetchUserBusinesses, createBusiness, testServerConnection } from '../utils/businessApi';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { isAdminUser } from '../utils/authUtils';

interface Business {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessContextType {
  selectedBusiness: Business | null;
  userBusinesses: Business[];
  setSelectedBusiness: (business: Business | null) => void;
  switchBusiness: (businessId: string) => void;
  createNewBusiness: (businessData: any) => Promise<Business | null>;
  refreshBusinesses: () => Promise<void>;
  retryBusinessLoad: () => Promise<void>;
  isLoading: boolean;
  needsBusinessSetup: boolean;
  hasLoadingError: boolean;
  isServerAvailable: boolean;
  serverErrorMessage: string | null;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
  user: any;
  supabaseAvailable?: boolean; // This is now for custom server, not auth
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ 
  children, 
  user, 
  supabaseAvailable = true // This represents custom server availability
}) => {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [needsBusinessSetup, setNeedsBusinessSetup] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(supabaseAvailable);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);

  // Prevent duplicate loading
  const loadedForUserRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // REMOVED: Console log on every render was causing performance issues
  // console.log('BusinessProvider: Render for user:', user?.email || 'none', 'CustomServer:', supabaseAvailable);

  // Get localStorage key for user's last selected business
  const getLastBusinessKey = () => {
    return user?.id ? `cofounder_last_business_${user?.id}` : null;
  };

  // Save selected business to localStorage
  const saveLastSelectedBusiness = (business: Business | null) => {
    const key = getLastBusinessKey();
    if (key) {
      if (business) {
        localStorage.setItem(key, business.id);
      } else {
        localStorage.removeItem(key);
      }
    }
  };

  // Get last selected business from localStorage
  const getLastSelectedBusinessId = (): string | null => {
    const key = getLastBusinessKey();
    return key ? localStorage.getItem(key) : null;
  };

  // Enhanced setSelectedBusiness that saves to localStorage
  const handleSetSelectedBusiness = (business: Business | null) => {
    console.log('BusinessContext: Setting selected business:', business?.name || 'none');
    setSelectedBusiness(business);
    saveLastSelectedBusiness(business);
  };

  // Simple business loading function
  const loadUserBusinesses = async (): Promise<void> => {
    // No need to check sign-out flag anymore - we handle it via React state in App.tsx
    
    if (!user) {
      console.log('BusinessContext: No user');
      setUserBusinesses([]);
      setSelectedBusiness(null);
      setIsServerAvailable(false);
      setServerErrorMessage(null);
      return;
    }

    // CRITICAL: Skip business loading for admin users
    if (isAdminUser(user)) {
      console.log('BusinessContext: Admin user detected - skipping business load');
      setUserBusinesses([]);
      setSelectedBusiness(null);
      setIsServerAvailable(true);
      setServerErrorMessage(null);
      setNeedsBusinessSetup(false);
      setHasLoadingError(false);
      return;
    }

    // If custom server is unavailable, use sample data for demo
    if (!supabaseAvailable) {
      console.log('BusinessContext: Custom server unavailable, using sample data');
      const sampleBusinesses: Business[] = [
        {
          id: 'sample-1',
          name: 'Tech Startup Inc',
          industry: 'Technology',
          description: 'A cutting-edge technology startup',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'sample-2', 
          name: 'Green Solutions LLC',
          industry: 'Sustainability',
          description: 'Eco-friendly business solutions',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];
      
      setUserBusinesses(sampleBusinesses);
      setIsServerAvailable(false);
      setServerErrorMessage('Using demo data - server unavailable');
      setHasLoadingError(false);
      
      // Auto-select first business
      const lastSelectedId = getLastSelectedBusinessId();
      const businessToSelect = lastSelectedId 
        ? sampleBusinesses.find(b => b.id === lastSelectedId) || sampleBusinesses[0]
        : sampleBusinesses[0];
      
      setSelectedBusiness(businessToSelect);
      saveLastSelectedBusiness(businessToSelect);
      console.log('BusinessContext: Auto-selected sample business:', businessToSelect.name);
      return;
    }

    // Prevent duplicate loads
    if (isLoadingRef.current || loadedForUserRef.current === user?.id) {
      console.log('BusinessContext: Already loading or loaded for user:', user?.id);
      return;
    }

    console.log('BusinessContext: Loading businesses for user:', user?.email, 'User ID:', user?.id);
    isLoadingRef.current = true;
    
    // PERFORMANCE OPTIMIZATION: Load cached data immediately, then fetch fresh data
    const cachedKey = `businesses_cache_${user.id}`;
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      try {
        const cachedBusinesses = JSON.parse(cached);
        console.log('BusinessContext: Loading from cache immediately:', cachedBusinesses.length, 'businesses');
        setUserBusinesses(cachedBusinesses);
        setIsLoading(false); // Remove loading state immediately
        
        // Auto-select cached business
        const lastSelectedId = getLastSelectedBusinessId();
        const businessToSelect = lastSelectedId 
          ? cachedBusinesses.find((b: Business) => b.id === lastSelectedId) || cachedBusinesses[0]
          : cachedBusinesses[0];
        
        if (businessToSelect) {
          setSelectedBusiness(businessToSelect);
          console.log('BusinessContext: Auto-selected cached business:', businessToSelect.name);
        }
      } catch (cacheError) {
        console.error('BusinessContext: Cache parse error:', cacheError);
      }
    }

    // Now fetch fresh data in background with reduced timeout
    try {
      console.log('BusinessContext: Fetching fresh business data in background...');
      const businesses = await Promise.race([
        fetchUserBusinesses(),
        new Promise<Business[]>((_, reject) => 
          setTimeout(() => reject(new Error('Business fetch timeout')), 6000) // 6 seconds - slightly more than API timeout
        )
      ]);

      loadedForUserRef.current = user?.id;

      console.log('BusinessContext: Fresh data loaded:', businesses.length, 'businesses');
      
      // Cache the fresh data
      try {
        localStorage.setItem(cachedKey, JSON.stringify(businesses));
      } catch (storageError) {
        console.error('BusinessContext: Failed to cache businesses:', storageError);
      }
      
      setUserBusinesses(businesses);
      setIsServerAvailable(true);
      setServerErrorMessage(null);
      setHasLoadingError(false);

      // Auto-select a business if we have any
      if (businesses.length > 0) {
        const lastSelectedId = getLastSelectedBusinessId();
        const businessToSelect = lastSelectedId 
          ? businesses.find(b => b.id === lastSelectedId) || businesses[0]
          : businesses[0];
        
        setSelectedBusiness(businessToSelect);
        saveLastSelectedBusiness(businessToSelect);
        console.log('BusinessContext: Auto-selected fresh business:', businessToSelect.name, '(' + businessToSelect.id + ')');
      } else {
        console.log('BusinessContext: No businesses found - user needs to create one');
        setSelectedBusiness(null);
      }

    } catch (error) {
      console.error('BusinessContext: Failed to load real business data:', error.message);
      
      // Only use fallback data as a last resort
      setIsServerAvailable(false);
      setServerErrorMessage(`Failed to load business data: ${error.message}`);
      setHasLoadingError(true);
      
      // CRITICAL FIX: Don't clear existing businesses on refresh failure!
      // Only clear if we have NO businesses yet (initial load)
      if (userBusinesses.length === 0) {
        console.log('BusinessContext: No existing businesses, clearing state');
        setUserBusinesses([]);
        setSelectedBusiness(null);
      } else {
        console.log('BusinessContext: Keeping existing', userBusinesses.length, 'businesses despite refresh failure');
        // Keep existing businesses - don't clear them!
      }
    } finally {
      isLoadingRef.current = false;
      // setIsLoading(false); // REMOVED - not using loading screen anymore
    }
  };

  // Simple effect - only load when user changes
  useEffect(() => {
    if (user && loadedForUserRef.current !== user?.id) {
      console.log('BusinessContext: User changed or signed in, forcing fresh business load...');
      console.log('BusinessContext: Previous user:', loadedForUserRef.current, 'Current user:', user?.id);
      
      // SKIP LOADING if user is on Business Management page - they'll load it themselves
      const currentPath = window.location.pathname;
      const isOnBusinessManagementPage = currentPath.includes('/business-management') || 
                                         currentPath.includes('/businesses');
      
      if (isOnBusinessManagementPage) {
        console.log('BusinessContext: User is on Business Management page - SKIPPING auto-load');
        loadedForUserRef.current = user?.id; // Mark as loaded to prevent future attempts
        setIsServerAvailable(supabaseAvailable);
        setIsLoading(false);
        return;
      }
      
      // FORCE complete reset when user changes
      loadedForUserRef.current = null;
      isLoadingRef.current = false;
      setUserBusinesses([]);
      setSelectedBusiness(null);
      setIsServerAvailable(supabaseAvailable);
      setServerErrorMessage(null);
      setHasLoadingError(false);
      setIsLoading(false);
      
      // Load immediately without setTimeout delay
      loadUserBusinesses();
      
    } else if (!user) {
      // Clear state when no user
      console.log('BusinessContext: User signed out, clearing all state');
      setUserBusinesses([]);
      setSelectedBusiness(null);
      setIsServerAvailable(false);
      setServerErrorMessage(null);
      setHasLoadingError(false);
      loadedForUserRef.current = null;
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.id]); // REMOVED supabaseAvailable to prevent unnecessary reloads

  const refreshBusinesses = async (): Promise<void> => {
    if (!user) {
      console.warn('BusinessContext: Cannot refresh businesses - no user available');
      return; // Return gracefully instead of throwing
    }
    
    if (!supabaseAvailable) {
      console.warn('BusinessContext: Cannot refresh businesses - server unavailable');
      return; // Return gracefully instead of throwing
    }

    console.log('BusinessContext: Manually refreshing businesses...');
    loadedForUserRef.current = null; // Reset loaded flag
    await loadUserBusinesses();
  };

  const retryBusinessLoad = async (): Promise<void> => {
    console.log('BusinessContext: Retrying business load...');
    loadedForUserRef.current = null; // Reset loaded flag
    await loadUserBusinesses();
  };

  const createNewBusiness = async (businessData: any): Promise<Business | null> => {
    if (!user || !supabaseAvailable) return null;
    
    try {
      console.log('BusinessContext: Creating business:', businessData.name);
      const business = await createBusiness(businessData);
      
      if (business) {
        console.log('BusinessContext: Business created successfully:', business.name);
        
        // Add to list and select it IMMEDIATELY for instant UI update
        setUserBusinesses(prev => [...prev, business]);
        setSelectedBusiness(business);
        saveLastSelectedBusiness(business);
        
        // BACKGROUND SYNC: Refresh from database after 2 seconds to ensure persistence
        // This doesn't block the UI but ensures the business is synced with database
        setTimeout(async () => {
          try {
            console.log('BusinessContext: Background sync - refreshing businesses from database...');
            const businesses = await fetchUserBusinesses();
            if (businesses.length > 0) {
              setUserBusinesses(businesses);
              // Re-select the business if it exists
              const syncedBusiness = businesses.find(b => b.id === business.id);
              if (syncedBusiness) {
                setSelectedBusiness(syncedBusiness);
                console.log('BusinessContext: Background sync complete - business confirmed in database');
              }
            }
          } catch (error) {
            console.log('BusinessContext: Background sync failed (non-critical):', error);
            // Don't throw - the business is already in local state
          }
        }, 2000);
        
        return business;
      }
      return null;
    } catch (error) {
      console.error('BusinessContext: Create failed:', error);
      throw error;
    }
  };

  const value: BusinessContextType = {
    selectedBusiness,
    userBusinesses,
    setSelectedBusiness: handleSetSelectedBusiness,
    switchBusiness: (businessId: string) => {
      const business = userBusinesses.find(b => b.id === businessId);
      if (business) {
        handleSetSelectedBusiness(business);
      }
    },
    createNewBusiness,
    refreshBusinesses,
    retryBusinessLoad,
    isLoading,
    needsBusinessSetup,
    hasLoadingError,
    isServerAvailable,
    serverErrorMessage
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};