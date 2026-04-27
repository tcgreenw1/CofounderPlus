import { supabase } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

export interface Business {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced timeout wrapper with better error classification
const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`businessApi: Request to ${url} timed out after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).catch((error) => {
    clearTimeout(timeoutId);
    // Enhance error with more context
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network connection failed - check internet connectivity');
    }
    throw error;
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Simple server reachability test - now with proper authorization
const isServerReachable = async (): Promise<boolean> => {
  // Quick browser online check
  if (!navigator.onLine) {
    console.log('businessApi: Browser is offline');
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Very fast timeout
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ping`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}` // Add public anon key for "public" endpoints
          }
        }
      );
      
      clearTimeout(timeoutId);
      const isReachable = response.ok;
      console.log('businessApi: Server reachable:', isReachable, 'Status:', response.status);
      return isReachable;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.log('businessApi: Server not reachable:', error.message);
    return false;
  }
};

// Enhanced error handling with classification
const classifyError = (error: any): { type: 'network' | 'auth' | 'server' | 'timeout' | 'unknown', message: string, canRetry: boolean } => {
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Please check your internet connection.',
      canRetry: true
    };
  }
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')) {
    return {
      type: 'network',
      message: 'Network error. Please check your internet connection.',
      canRetry: true
    };
  }
  
  if (error.message?.includes('401') || error.message?.includes('Authentication')) {
    return {
      type: 'auth',
      message: 'Authentication error. Please sign in again.',
      canRetry: false
    };
  }
  
  if (error.message?.includes('500') || error.message?.includes('Server error')) {
    return {
      type: 'server',
      message: 'Server temporarily unavailable. Please try again later.',
      canRetry: true
    };
  }
  
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred.',
    canRetry: true
  };
};

export const fetchUserBusinesses = async (): Promise<Business[]> => {
  try {
    console.log('businessApi: Starting fetchUserBusinesses...');
    
    // Skip if offline
    if (!navigator.onLine) {
      console.log('businessApi: Browser offline, returning empty list');
      return [];
    }
    
    // Quick server check FIRST - before trying anything else
    // TEMPORARILY DISABLED - Causing freezing until server is deployed with /ping endpoint
    // const serverReachable = await isServerReachable();
    // if (!serverReachable) {
    //   console.log('businessApi: Server unreachable, returning empty list immediately');
    //   return [];
    // }
    
    // Get session quickly or fail
    let session;
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 2000))
      ]) as any;
      
      session = sessionResult?.data?.session;
      
      if (!session?.access_token) {
        console.log('businessApi: No valid session, returning empty list');
        return [];
      }
    } catch (error) {
      console.log('businessApi: Session fetch failed, returning empty list');
      return [];
    }

    console.log('businessApi: Making API request to fetch businesses');
    
    // FIXED: Increased timeout - 500ms was TOO FAST and causing businesses to not load
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout - reasonable for mobile
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      console.log(`businessApi: Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('businessApi: Raw response data:', data);
        
        const businesses = data.businesses || data || [];
        
        // CRITICAL FIX: Filter out temporary businesses and board IDs
        // Only filter if id exists and starts with 'temp-' or 'board_'
        const validBusinesses = businesses.filter((b: Business) => {
          if (!b || !b.id) {
            console.warn('businessApi: Found business without ID, filtering out:', b);
            return false;
          }
          const id = b.id.toString();
          // Filter out temp businesses and boards
          const isTemp = id.startsWith('temp-');
          const isBoard = id.startsWith('board_');
          
          // CRITICAL FIX: Filter out businesses with blank/empty names
          const hasBlankName = !b.name || b.name.trim() === '';
          
          if (isTemp) {
            console.log('businessApi: Filtering out temp business:', b.id);
          }
          if (isBoard) {
            console.log('businessApi: Filtering out board ID from business list:', b.id);
          }
          if (hasBlankName) {
            console.log('businessApi: Filtering out business with blank name:', b.id);
          }
          
          return !isTemp && !isBoard && !hasBlankName;
        });
        
        if (validBusinesses.length !== businesses.length) {
          // Silently filter out temporary/draft businesses and boards
          console.log(`businessApi: Loaded ${validBusinesses.length} active businesses (filtered ${businesses.length - validBusinesses.length} drafts/boards)`);
        }
        
        console.log(`businessApi: Successfully fetched ${validBusinesses.length} businesses`);
        console.log('businessApi: Business names:', validBusinesses.map((b: Business) => b.name));
        console.log('businessApi: Business IDs:', validBusinesses.map((b: Business) => b.id));
        
        return validBusinesses;
      } else if (response.status === 404) {
        console.log('businessApi: No businesses found (404)');
        return [];
      } else if (response.status === 401) {
        console.log('businessApi: Authentication error (401), returning empty array');
        return [];
      } else if (response.status >= 500) {
        console.log('businessApi: Server error, returning empty array for now');
        return [];
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.log('businessApi: Non-critical error fetching businesses:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        // Return empty array instead of throwing for non-critical errors
        return [];
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('businessApi: Fetch request failed:', fetchError.message);
      return [];
    }
  } catch (error) {
    // DO NOT LOG ERROR - just return empty array silently
    console.log('businessApi: Fetch failed, returning empty array');
    return [];
  }
};

export const createBusiness = async (businessData: {
  name: string;
  description?: string;
}): Promise<Business | null> => {
  const startTime = Date.now();
  console.log('businessApi: Starting business creation process...', {
    name: businessData.name,
    timestamp: new Date().toISOString()
  });

  try {
    // Check server connectivity first
    // TEMPORARILY DISABLED - Causing freezing until server is deployed with /ping endpoint  
    // const serverReachable = await isServerReachable();
    // if (!serverReachable) {
    //   throw new Error('Server is currently unavailable. Please try again later.');
    // }

    // Get current session with explicit timeout
    console.log('businessApi: Getting current session...');
    const sessionPromise = supabase.auth.getSession();
    const sessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
    );
    
    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      sessionTimeout
    ]) as any;
    
    if (sessionError || !session?.access_token) {
      console.error('businessApi: No valid session for creating business:', sessionError?.message);
      throw new Error('Authentication required. Please sign in again.');
    }

    console.log('businessApi: Valid session obtained, making API request...', {
      userId: session.user.id,
      hasAccessToken: !!session.access_token
    });
    
    // Use fetch with shorter timeout for business creation
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: businessData.name.trim(),
          description: businessData.description?.trim() || ''
        })
      },
      15000 // 15 second timeout for business creation
    );

    const responseTime = Date.now() - startTime;
    console.log(`businessApi: Create business response received after ${responseTime}ms, status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      const business = data.business || data;
      
      console.log('businessApi: Business created successfully:', {
        id: business?.id,
        name: business?.name,
        totalTime: Date.now() - startTime
      });
      
      return business;
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('businessApi: Failed to create business:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        requestData: businessData,
        totalTime: Date.now() - startTime
      });
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Please check your account.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again in a moment.');
      } else {
        throw new Error(`Failed to create business: ${errorText || 'Unknown error'}`);
      }
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorInfo = classifyError(error);
    
    console.error('businessApi: Error creating business:', {
      type: errorInfo.type,
      message: errorInfo.message,
      canRetry: errorInfo.canRetry,
      businessData,
      totalTime,
      originalError: error.message
    });
    
    // Re-throw with classified error message
    throw new Error(errorInfo.message);
  }
};

export const updateBusiness = async (businessId: string, businessData: {
  name?: string;
  description?: string;
}): Promise<Business | null> => {
  try {
    console.log('businessApi: Updating business:', businessId);
    
    // Check server connectivity first
    // TEMPORARILY DISABLED - Causing freezing until server is deployed with /ping endpoint
    // const serverReachable = await isServerReachable();
    // if (!serverReachable) {
    //   throw new Error('Server is currently unavailable. Please try again later.');
    // }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('businessApi: No valid session for updating business:', sessionError?.message);
      throw new Error('Authentication required. Please sign in again.');
    }

    console.log('businessApi: Making API request to update business');
    
    // Use fetch with timeout
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${businessId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessData)
      },
      8000 // 8 second timeout
    );

    console.log(`businessApi: Update business response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      const business = data.business;
      console.log('businessApi: Business updated successfully:', business?.name);
      return business;
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('businessApi: Failed to update business:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again in a moment.');
      } else {
        throw new Error(`Failed to update business: ${errorText || 'Unknown error'}`);
      }
    }
  } catch (error) {
    const errorInfo = classifyError(error);
    console.error('businessApi: Error updating business:', {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: error.message
    });
    
    throw new Error(errorInfo.message);
  }
};

export const deleteBusiness = async (businessId: string): Promise<boolean> => {
  try {
    console.log('businessApi: Deleting business:', businessId);
    
    // Check server connectivity first
    // TEMPORARILY DISABLED - Causing freezing until server is deployed with /ping endpoint
    // const serverReachable = await isServerReachable();
    // if (!serverReachable) {
    //   throw new Error('Server is currently unavailable. Please try again later.');
    // }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('businessApi: No valid session for deleting business:', sessionError?.message);
      throw new Error('Authentication required. Please sign in again.');
    }

    console.log('businessApi: Making API request to delete business');
    
    // Use fetch with timeout
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${businessId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      },
      8000 // 8 second timeout
    );

    console.log(`businessApi: Delete business response status: ${response.status}`);

    if (response.ok) {
      console.log('businessApi: Business deleted successfully');
      return true;
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('businessApi: Failed to delete business:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again in a moment.');
      } else {
        throw new Error(`Failed to delete business: ${errorText || 'Unknown error'}`);
      }
    }
  } catch (error) {
    const errorInfo = classifyError(error);
    console.error('businessApi: Error deleting business:', {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: error.message
    });
    
    throw new Error(errorInfo.message);
  }
};

// Enhanced server connection test with better error handling - now with proper authorization
export const testServerConnection = async (): Promise<{ status: 'success' | 'error', message: string, data?: any }> => {
  try {
    console.log('businessApi: Testing server connection...');
    
    // Quick browser online check first
    if (!navigator.onLine) {
      return {
        status: 'error',
        message: 'Browser is offline'
      };
    }

    // Try unauthenticated endpoint first (faster) - but with public anon key
    try {
      const pingResponse = await fetchWithTimeout(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ping`,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}` // Add public anon key
          }
        },
        2000 // 2 second timeout for ping
      );

      if (pingResponse.ok) {
        console.log('businessApi: Server ping successful');
        return { 
          status: 'success', 
          message: 'Server connection successful'
        };
      }
    } catch (pingError) {
      console.log('businessApi: Ping failed, trying authenticated test...');
    }

    // Fall back to authenticated test
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      return {
        status: 'error',
        message: 'No valid session for testing connection'
      };
    }

    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/test`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      },
      3000 // 3 second timeout for authenticated test
    );

    if (response.ok) {
      const data = await response.json();
      console.log('businessApi: Server connection test successful');
      return { 
        status: 'success', 
        message: 'Server connection successful',
        data 
      };
    } else {
      return {
        status: 'error',
        message: `Server test failed: ${response.status}`
      };
    }
  } catch (error) {
    const errorInfo = classifyError(error);
    console.error('businessApi: Server connection test failed:', error);
    return {
      status: 'error',
      message: errorInfo.message
    };
  }
};

// New function to check if business API is available
export const isBusinessApiAvailable = async (): Promise<boolean> => {
  try {
    const result = await testServerConnection();
    return result.status === 'success';
  } catch (error) {
    console.log('businessApi: Business API availability check failed');
    return false;
  }
};