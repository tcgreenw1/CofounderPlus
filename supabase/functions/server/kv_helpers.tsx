/**
 * Helper functions with timeout and retry logic for KV operations
 * This prevents query timeouts from breaking the application
 */

import * as kv from './kv_store.tsx';

// Default timeout for KV operations (5 seconds)
const KV_TIMEOUT_MS = 5000;

// Helper to wrap promises with timeout
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('KV operation timeout')), timeoutMs)
    )
  ]);
};

/**
 * Get with timeout and fallback
 */
export const safeGet = async (key: string, defaultValue: any = null, timeoutMs: number = KV_TIMEOUT_MS): Promise<any> => {
  try {
    const result = await withTimeout(kv.get(key), timeoutMs);
    return result ?? defaultValue;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.warn(`⚠️ KV get timeout for key: ${key}, returning default value`);
    } else {
      console.error(`❌ KV get failed for ${key}:`, error.message);
    }
    return defaultValue;
  }
};

/**
 * Get by prefix with timeout and fallback
 */
export const safeGetByPrefix = async (prefix: string, defaultValue: any[] = [], timeoutMs: number = KV_TIMEOUT_MS): Promise<any[]> => {
  try {
    const result = await withTimeout(kv.getByPrefix(prefix), timeoutMs);
    return result ?? defaultValue;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.warn(`⚠️ KV getByPrefix timeout for prefix: ${prefix}, returning default value`);
    } else {
      console.error(`❌ KV getByPrefix failed for ${prefix}:`, error.message);
    }
    return defaultValue;
  }
};

/**
 * Set with timeout and error handling
 */
export const safeSet = async (key: string, value: any, timeoutMs: number = KV_TIMEOUT_MS): Promise<boolean> => {
  try {
    await withTimeout(kv.set(key, value), timeoutMs);
    return true;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.error(`⚠️ KV set timeout for key: ${key}`);
    } else {
      console.error(`❌ KV set failed for ${key}:`, error.message);
    }
    return false;
  }
};

/**
 * Delete with timeout and error handling
 */
export const safeDel = async (key: string, timeoutMs: number = KV_TIMEOUT_MS): Promise<boolean> => {
  try {
    await withTimeout(kv.del(key), timeoutMs);
    return true;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.error(`⚠️ KV del timeout for key: ${key}`);
    } else {
      console.error(`❌ KV del failed for ${key}:`, error.message);
    }
    return false;
  }
};

/**
 * Multi-get with timeout and fallback
 */
export const safeMget = async (keys: string[], defaultValue: any[] = [], timeoutMs: number = KV_TIMEOUT_MS): Promise<any[]> => {
  try {
    const result = await withTimeout(kv.mget(keys), timeoutMs);
    return result ?? defaultValue;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.warn(`⚠️ KV mget timeout for keys: ${keys.join(', ')}, returning default value`);
    } else {
      console.error(`❌ KV mget failed:`, error.message);
    }
    return defaultValue;
  }
};

/**
 * Multi-set with timeout and error handling
 */
export const safeMset = async (keys: string[], values: any[], timeoutMs: number = KV_TIMEOUT_MS): Promise<boolean> => {
  try {
    await withTimeout(kv.mset(keys, values), timeoutMs);
    return true;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.error(`⚠️ KV mset timeout for keys: ${keys.join(', ')}`);
    } else {
      console.error(`❌ KV mset failed:`, error.message);
    }
    return false;
  }
};

/**
 * Multi-delete with timeout and error handling
 */
export const safeMdel = async (keys: string[], timeoutMs: number = KV_TIMEOUT_MS): Promise<boolean> => {
  try {
    await withTimeout(kv.mdel(keys), timeoutMs);
    return true;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.error(`⚠️ KV mdel timeout for keys: ${keys.join(', ')}`);
    } else {
      console.error(`❌ KV mdel failed:`, error.message);
    }
    return false;
  }
};
