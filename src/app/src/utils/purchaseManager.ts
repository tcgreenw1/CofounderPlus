/**
 * In-App Purchase (IAP) Utilities for Apple App Store
 * Re-exports from iapManager for backwards compatibility
 */

export {
  IAP_PRODUCT_IDS,
  PRODUCT_TO_PLAN_MAP,
  isIAPAvailable,
  initializeIAP,
  getOfferings,
  purchaseProduct,
  restorePurchases,
  getCustomerInfo,
  validateReceipt,
  setupPurchaseListener
} from './iapManager';

// Legacy export for compatibility
export const IAP_PRODUCT_MAP = {
  'com.cofounderplus.launch.monthly': {
    productId: 'com.cofounderplus.launch.monthly',
    planId: 'creator',
    planName: 'Launch',
    billingPeriod: 'monthly' as const
  },
  'com.cofounderplus.launch.annual': {
    productId: 'com.cofounderplus.launch.annual',
    planId: 'creator',
    planName: 'Launch',
    billingPeriod: 'annual' as const
  },
  'com.cofounderplus.grow.monthly': {
    productId: 'com.cofounderplus.grow.monthly',
    planId: 'builder',
    planName: 'Grow',
    billingPeriod: 'monthly' as const
  },
  'com.cofounderplus.grow.annual': {
    productId: 'com.cofounderplus.grow.annual',
    planId: 'builder',
    planName: 'Grow',
    billingPeriod: 'annual' as const
  },
  'com.cofounderplus.scale.monthly': {
    productId: 'com.cofounderplus.scale.monthly',
    planId: 'studio',
    planName: 'Scale',
    billingPeriod: 'monthly' as const
  },
  'com.cofounderplus.scale.annual': {
    productId: 'com.cofounderplus.scale.annual',
    planId: 'studio',
    planName: 'Scale',
    billingPeriod: 'annual' as const
  },
};

export interface IAPProduct {
  productId: string;
  planId: string;
  planName: string;
  billingPeriod: 'monthly' | 'annual';
}
