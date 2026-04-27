/**
 * Native Apple IAP Endpoints (Re-export)
 * 
 * ✅ NO RevenueCat dependency
 * ✅ Direct Apple StoreKit integration via @capacitor-community/in-app-purchases
 * ✅ Simple, clean implementation
 * 
 * This is a compatibility layer that re-exports the native IAP endpoints
 * to maintain backwards compatibility with existing code.
 * 
 * All functionality now handled by apple-iap-native-endpoints.tsx
 */

// Re-export native IAP endpoints for backwards compatibility
import nativeIAPRoutes from './apple-iap-native-endpoints.tsx';

// Export as default for compatibility
export default nativeIAPRoutes;
