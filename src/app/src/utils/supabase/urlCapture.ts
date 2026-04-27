/**
 * URL Parameter Capture
 * 
 * CRITICAL: This must run BEFORE Supabase client is initialized!
 * Supabase's detectSessionInUrl will strip URL parameters immediately,
 * so we need to capture them first and store them in sessionStorage.
 */

const URL_CAPTURE_KEY = 'supabase_callback_params';

// Capture URL parameters immediately (runs synchronously before anything else)
export function captureCallbackParams() {
  // Only run this on the callback URL
  if (!window.location.pathname.includes('/auth/callback')) {
    return;
  }

  const url = window.location.href;
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  const params: Record<string, string> = {};

  // Capture ALL search params
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Capture ALL hash params
  hashParams.forEach((value, key) => {
    params[`hash_${key}`] = value; // Prefix hash params to distinguish them
  });

  // Only store if we actually have params
  if (Object.keys(params).length > 0) {
    console.log('🎯 URL CAPTURE: Storing callback params BEFORE Supabase strips them:', params);
    sessionStorage.setItem(URL_CAPTURE_KEY, JSON.stringify({
      params,
      timestamp: Date.now(),
      originalUrl: url
    }));
  }
}

// Retrieve captured parameters
export function getCapturedParams(): { params: Record<string, string>; originalUrl: string } | null {
  const stored = sessionStorage.getItem(URL_CAPTURE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const data = JSON.parse(stored);
    console.log('🎯 URL CAPTURE: Retrieved stored params:', data.params);
    return data;
  } catch (e) {
    console.error('🎯 URL CAPTURE: Failed to parse stored params:', e);
    return null;
  }
}

// Clear captured parameters after use
export function clearCapturedParams() {
  console.log('🎯 URL CAPTURE: Clearing stored params');
  sessionStorage.removeItem(URL_CAPTURE_KEY);
}

// Run capture immediately when this module loads
if (typeof window !== 'undefined') {
  captureCallbackParams();
}
