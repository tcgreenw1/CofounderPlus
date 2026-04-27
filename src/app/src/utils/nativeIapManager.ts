/**
 * Native iOS In-App Purchase Manager
 * Uses cordova-plugin-purchase for production-ready StoreKit integration
 * 
 * This is a battle-tested, production-ready IAP solution that:
 * - Directly integrates with Apple StoreKit
 * - Handles receipt validation
 * - Manages subscriptions and transactions
 * - Works seamlessly with Capacitor
 * 
 * Documentation: https://github.com/j3k0/cordova-plugin-purchase
 */

import { Capacitor } from '@capacitor/core';
import { projectId, publicAnonKey } from './supabase/info';

// Re-export the store object for direct access if needed
export let store: any = null;

// Product IDs configured in App Store Connect
export const IAP_PRODUCT_IDS = {
  // Launch Plan (formerly Creator)
  LAUNCH_MONTHLY: 'launch',
  LAUNCH_ANNUAL: 'LaunchAnnual',
  
  // Grow Plan (formerly Builder)
  GROW_MONTHLY: 'GrowMonthly',
  GROW_ANNUAL: 'GrowAnnual',
  
  // Scale Plan (formerly Studio)
  SCALE_MONTHLY: 'ScaleMonthly',
  // Note: No Scale Annual - price exceeds $999 IAP limit
};

// Map product IDs to plan names for backend sync
export const PRODUCT_TO_PLAN_MAP: Record<string, { planId: string; planName: string; billingPeriod: 'monthly' | 'annual' }> = {
  'launch': { planId: 'creator', planName: 'Launch', billingPeriod: 'monthly' },
  'LaunchAnnual': { planId: 'creator', planName: 'Launch', billingPeriod: 'annual' },
  'GrowMonthly': { planId: 'builder', planName: 'Grow', billingPeriod: 'monthly' },
  'GrowAnnual': { planId: 'builder', planName: 'Grow', billingPeriod: 'annual' },
  'ScaleMonthly': { planId: 'studio', planName: 'Scale', billingPeriod: 'monthly' },
};

// TypeScript interfaces
export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
  type: 'subscription' | 'consumable' | 'non-consumable';
}

export interface IAPTransaction {
  productId: string;
  transactionId: string;
  receipt: string;
  signature?: string;
}

interface IAPPurchaseResult {
  productId: string;
  transactionId: string;
  receipt: string;
}

let isInitialized = false;

/**
 * Check if IAP is available (iOS native platform)
 */
export function isIAPAvailable(): boolean {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  
  return isNative && isIOS;
}

/**
 * Load the cordova-plugin-purchase store
 */
async function getStore(): Promise<any> {
  if (store) {
    return store;
  }

  try {
    if (!isIAPAvailable()) {
      throw new Error('Not running on iOS native platform');
    }

    // Wait for deviceready event if not fired yet
    if (!(window as any).cordova) {
      console.log('⏳ Native IAP: Waiting for Cordova to load...');
      await new Promise<void>((resolve) => {
        document.addEventListener('deviceready', () => {
          console.log('✅ Native IAP: Cordova deviceready fired');
          resolve();
        }, false);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn('⚠️ Native IAP: deviceready timeout - continuing anyway');
          resolve();
        }, 5000);
      });
    }

    // Additional wait to ensure plugin is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Access the global CdvPurchase object injected by cordova-plugin-purchase
    if (typeof (window as any).CdvPurchase === 'undefined') {
      // Log detailed diagnostics
      console.error('❌ Native IAP: CdvPurchase not found');
      console.log('🔍 Diagnostics:', {
        hasCordova: !!(window as any).cordova,
        hasCdvPurchase: !!(window as any).CdvPurchase,
        hasWindow: typeof window !== 'undefined',
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        availableGlobals: Object.keys(window).filter(k => k.includes('Cdv') || k.includes('cordova'))
      });
      throw new Error('cordova-plugin-purchase not loaded. Ensure plugin is installed and app is built for iOS.');
    }

    store = (window as any).CdvPurchase.store;
    
    if (!store) {
      throw new Error('Store object not available');
    }

    console.log('✅ Native IAP: Store loaded successfully');
    return store;
  } catch (error: any) {
    console.error('❌ Native IAP: Failed to access store:', error.message);
    throw error;
  }
}

/**
 * Initialize native IAP connection
 */
export async function initializeIAP(): Promise<void> {
  if (!isIAPAvailable()) {
    console.log('⚠️ Native IAP: Not on iOS, skipping initialization');
    return;
  }

  if (isInitialized) {
    console.log('✅ Native IAP: Already initialized');
    return;
  }

  try {
    console.log('🔧 Native IAP: Initializing StoreKit via cordova-plugin-purchase...');
    
    const storeInstance = await getStore();
    const { ProductType, Platform } = (window as any).CdvPurchase;

    // Register all products
    console.log('📦 Registering products...');
    Object.values(IAP_PRODUCT_IDS).forEach(productId => {
      storeInstance.register({
        id: productId,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.APPLE_APPSTORE,
      });
    });

    // Set up event handlers
    setupStoreHandlers(storeInstance);

    // Initialize the store
    await storeInstance.initialize([Platform.APPLE_APPSTORE]);
    
    isInitialized = true;
    console.log('✅ Native IAP: StoreKit initialized successfully via cordova-plugin-purchase');
    
  } catch (error: any) {
    console.error('❌ Native IAP: Failed to initialize:', error);
    throw error;
  }
}

/**
 * Setup store event handlers
 */
function setupStoreHandlers(storeInstance: any): void {
  try {
    // Handle approved transactions
    storeInstance.when().approved(async (transaction: any) => {
      console.log('✅ Purchase approved:', transaction.products[0]?.id);
      
      try {
        // Verify the receipt with backend
        const receipt = transaction.receipt;
        if (receipt) {
          await validateReceiptWithBackend(receipt);
        }
        
        // Finish the transaction
        transaction.finish();
      } catch (error) {
        console.error('❌ Failed to process approved transaction:', error);
      }
    });

    // Handle verified receipts
    storeInstance.when().verified((receipt: any) => {
      console.log('✅ Receipt verified:', receipt);
    });

    // Handle errors
    storeInstance.error((error: any) => {
      console.error('❌ Store error:', error);
    });

    // Note: We don't need to listen to product updates here
    // The approved and verified handlers are sufficient for IAP processing

    console.log('✅ Store event handlers configured');
  } catch (error) {
    console.error('❌ Failed to setup store handlers:', error);
    // Don't throw - allow IAP to continue even if some handlers fail
  }
}

/**
 * Validate receipt with backend
 */
async function validateReceiptWithBackend(receipt: string): Promise<void> {
  try {
    console.log('🔐 Validating receipt with backend...');
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/iap/validate-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ receipt }),
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Receipt validated successfully');
    
    return data;
  } catch (error) {
    console.error('❌ Receipt validation failed:', error);
    throw error;
  }
}

/**
 * Get products from App Store
 */
export async function getProducts(productIds: string[]): Promise<IAPProduct[]> {
  if (!isIAPAvailable()) {
    console.log('⚠️ Native IAP: Not available');
    return [];
  }

  try {
    console.log('📦 Native IAP: Fetching products...', productIds);
    
    const storeInstance = await getStore();
    
    // Wait for products to load
    await storeInstance.ready();
    
    const products: IAPProduct[] = [];
    
    for (const productId of productIds) {
      const product = storeInstance.get(productId);
      
      if (product && product.offers && product.offers.length > 0) {
        const offer = product.offers[0];
        
        products.push({
          productId: product.id,
          title: product.title || productId,
          description: product.description || '',
          price: offer.pricingPhases?.[0]?.price || '$0.00',
          priceValue: offer.pricingPhases?.[0]?.priceMicros ? 
            offer.pricingPhases[0].priceMicros / 1000000 : 0,
          currency: offer.pricingPhases?.[0]?.currency || 'USD',
          type: 'subscription',
        });
      }
    }

    console.log(`✅ Native IAP: Retrieved ${products.length} products`);
    return products;
    
  } catch (error: any) {
    console.error('❌ Native IAP: Failed to get products:', error);
    throw error;
  }
}

/**
 * Get all available subscription offerings
 */
export async function getOfferings(): Promise<IAPProduct[]> {
  const allProductIds = Object.values(IAP_PRODUCT_IDS);
  return await getProducts(allProductIds);
}

/**
 * Purchase a product by product ID
 */
export async function purchaseProduct(
  productId: string
): Promise<{ success: boolean; transaction?: IAPPurchaseResult; error?: string }> {
  if (!isIAPAvailable()) {
    return { success: false, error: 'IAP not available - not on iOS native app' };
  }

  try {
    console.log('🛒 Native IAP: Starting purchase for product:', productId);
    
    const storeInstance = await getStore();
    const product = storeInstance.get(productId);
    
    console.log('🔍 Product lookup result:', {
      productId,
      productFound: !!product,
      productTitle: product?.title,
      productPrice: product?.offers?.[0]?.pricingPhases?.[0]?.price,
      hasOffers: product?.offers?.length > 0,
      productState: product?.state,
      canPurchase: product?.canPurchase
    });
    
    if (!product) {
      const allProducts = storeInstance.products;
      const availableProductIds = allProducts.map((p: any) => p.id);
      console.error('❌ Product not found. Available products:', availableProductIds);
      throw new Error(`Product ${productId} not found. Available: ${availableProductIds.join(', ')}`);
    }

    // Check if product has offers
    if (!product.offers || product.offers.length === 0) {
      console.error('❌ Product has no offers:', {
        productId: product.id,
        title: product.title,
        state: product.state,
        owned: product.owned,
        canPurchase: product.canPurchase
      });
      throw new Error(`Product ${productId} has no available offers. Check App Store Connect status.`);
    }

    return new Promise((resolve) => {
      // Set up one-time handlers for this purchase
      const approvedHandler = storeInstance.when().approved(async (transaction: any) => {
        const purchasedProduct = transaction.products[0];
        
        if (purchasedProduct?.id === productId) {
          console.log('✅ Purchase approved:', productId);
          
          // Extract receipt
          const receipt = transaction.receipt;
          const transactionId = transaction.transactionId || `${Date.now()}`;
          
          resolve({
            success: true,
            transaction: {
              productId,
              transactionId,
              receipt,
            },
          });
        }
      });

      // Error handler - called directly on store instance, NOT through when()
      const errorHandler = storeInstance.error((error: any) => {
        console.error('❌ Purchase error:', error);
        
        if (error.code === storeInstance.ErrorCode.PAYMENT_CANCELLED) {
          resolve({ success: false, error: 'Purchase cancelled' });
        } else {
          resolve({ success: false, error: error.message || 'Purchase failed' });
        }
      });

      // Initiate the purchase
      const offer = product.offers[0];
      storeInstance.order(offer).then((error: any) => {
        if (error) {
          console.error('❌ Order failed:', error);
          resolve({ success: false, error: error.message });
        }
      });
    });

  } catch (error: any) {
    console.error('❌ Native IAP: Purchase failed:', error);
    
    if (error.message?.includes('cancelled')) {
      return { success: false, error: 'Purchase cancelled' };
    }
    
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{ 
  success: boolean; 
  transactions?: IAPTransaction[]; 
  error?: string 
}> {
  if (!isIAPAvailable()) {
    return { success: false, error: 'IAP not available' };
  }

  try {
    console.log('♻️ Native IAP: Restoring purchases...');
    
    const storeInstance = await getStore();
    
    // Refresh receipts from Apple
    await storeInstance.restorePurchases();
    
    // Wait for receipts to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get all owned products
    const transactions: IAPTransaction[] = [];
    const products = storeInstance.products;
    
    for (const product of products) {
      if (product.owned) {
        // Get the latest transaction
        const transaction = product.transaction;
        if (transaction) {
          transactions.push({
            productId: product.id,
            transactionId: transaction.transactionId || `${Date.now()}`,
            receipt: transaction.receipt || '',
          });
        }
      }
    }

    console.log(`✅ Native IAP: Restored ${transactions.length} purchases`);
    
    return {
      success: true,
      transactions,
    };
    
  } catch (error: any) {
    console.error('❌ Native IAP: Restore failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the receipt for the current user
 */
export async function getReceipt(): Promise<string | null> {
  if (!isIAPAvailable()) return null;

  try {
    const storeInstance = await getStore();
    
    // Get the application receipt
    const receipts = storeInstance.receipts;
    
    if (receipts && receipts.length > 0) {
      // Return the latest receipt
      return receipts[receipts.length - 1].raw;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Native IAP: Failed to get receipt:', error);
    return null;
  }
}

/**
 * Validate a receipt with backend
 */
export async function validateReceipt(
  receipt: string
): Promise<{ valid: boolean; data?: any; error?: string }> {
  return await validateReceiptWithBackend(receipt)
    .then(data => ({ valid: true, data }))
    .catch(error => ({ valid: false, error: error.message }));
}

/**
 * Set up purchase update listener
 */
export async function setupPurchaseListener(
  onPurchaseUpdate: (transaction: IAPTransaction) => void
): Promise<void> {
  if (!isIAPAvailable()) return;

  try {
    const storeInstance = await getStore();
    
    storeInstance.when().approved((transaction: any) => {
      const product = transaction.products[0];
      if (product) {
        onPurchaseUpdate({
          productId: product.id,
          transactionId: transaction.transactionId || `${Date.now()}`,
          receipt: transaction.receipt || '',
        });
      }
    });
    
    console.log('✅ Native IAP: Purchase listener active');
  } catch (error) {
    console.error('❌ Native IAP: Failed to setup listener:', error);
  }
}

/**
 * Finish a transaction
 */
export async function finishTransaction(transactionId: string): Promise<void> {
  if (!isIAPAvailable()) return;

  try {
    const storeInstance = await getStore();
    
    // Find the transaction and finish it
    const products = storeInstance.products;
    for (const product of products) {
      if (product.transaction?.transactionId === transactionId) {
        product.transaction.finish();
        console.log('✅ Native IAP: Transaction finished:', transactionId);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Native IAP: Failed to finish transaction:', error);
  }
}

/**
 * Get active subscriptions
 */
export async function getActiveSubscriptions(): Promise<string[]> {
  try {
    const storeInstance = await getStore();
    const activeProducts: string[] = [];
    
    const products = storeInstance.products;
    for (const product of products) {
      if (product.owned && product.type === 'paid subscription') {
        activeProducts.push(product.id);
      }
    }
    
    return activeProducts;
  } catch (error) {
    console.error('❌ Native IAP: Failed to get active subscriptions:', error);
    return [];
  }
}