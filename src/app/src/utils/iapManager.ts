/**
 * In-App Purchase Manager - Native iOS Implementation
 * Re-exports from nativeIapManager for backwards compatibility
 * 
 * ✅ NO RevenueCat dependency
 * ✅ Direct Apple StoreKit integration
 * ✅ Clean, simple API
 */

export {
  IAP_PRODUCT_IDS,
  PRODUCT_TO_PLAN_MAP,
  isIAPAvailable,
  initializeIAP,
  getOfferings,
  getProducts,
  purchaseProduct,
  restorePurchases,
  getReceipt,
  validateReceipt,
  setupPurchaseListener,
  finishTransaction,
  getActiveSubscriptions,
  type IAPProduct,
  type IAPTransaction,
} from './nativeIapManager';

// Legacy function for compatibility (no-op for native implementation)
export async function getCustomerInfo(): Promise<any> {
  console.log('⚠️ getCustomerInfo() is deprecated - use getActiveSubscriptions() instead');
  const activeSubscriptions = await import('./nativeIapManager').then(m => m.getActiveSubscriptions());
  return {
    activeSubscriptions: await activeSubscriptions,
    entitlements: { active: {} },
  };
}
