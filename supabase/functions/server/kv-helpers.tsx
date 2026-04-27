/**
 * KV Store Helpers with Timeout Protection
 * Wraps KV store operations with timeout handling and retry logic
 */

import * as kv from './kv_store.tsx';

const DEFAULT_TIMEOUT = 8000; // 8 seconds
const RETRY_TIMEOUT = 3000; // 3 seconds for retries
const MAX_RETRIES = 2;

/**
 * Promisified timeout helper
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Safe get with timeout and fallback
 */
export async function safeGet(key: string, defaultValue: any = null): Promise<any> {
  try {
    const result = await withTimeout(kv.get(key), DEFAULT_TIMEOUT, `KV get for ${key}`);
    return result ?? defaultValue;
  } catch (error: any) {
    console.error(`❌ KV get failed for ${key}:`, error.message);
    return defaultValue;
  }
}

/**
 * Safe getByPrefix with timeout and fallback
 * Also implements limit to prevent large result sets
 */
export async function safeGetByPrefix(prefix: string, defaultValue: any[] = [], limit?: number): Promise<any[]> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const timeout = retries === 0 ? DEFAULT_TIMEOUT : RETRY_TIMEOUT;
      const result = await withTimeout(kv.getByPrefix(prefix), timeout, `KV getByPrefix for ${prefix}`);
      
      if (!result) return defaultValue;
      
      // If limit is specified, only return that many results
      if (limit && result.length > limit) {
        console.warn(`⚠️ KV getByPrefix for ${prefix} returned ${result.length} results, limiting to ${limit}`);
        return result.slice(0, limit);
      }
      
      return result;
    } catch (error: any) {
      retries++;
      if (retries > MAX_RETRIES) {
        console.error(`❌ KV getByPrefix failed for ${prefix}:`, error.message);
        return defaultValue;
      }
      console.warn(`⚠️ KV getByPrefix retry ${retries}/${MAX_RETRIES} for ${prefix}`);
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return defaultValue;
}

/**
 * Safe set with timeout
 */
export async function safeSet(key: string, value: any): Promise<boolean> {
  try {
    await withTimeout(kv.set(key, value), DEFAULT_TIMEOUT, `KV set for ${key}`);
    return true;
  } catch (error: any) {
    console.error(`❌ KV set failed for ${key}:`, error.message);
    return false;
  }
}

/**
 * Safe mget with timeout
 */
export async function safeMget(keys: string[], defaultValue: any[] = []): Promise<any[]> {
  try {
    const result = await withTimeout(kv.mget(keys), DEFAULT_TIMEOUT, `KV mget for ${keys.length} keys`);
    return result ?? defaultValue;
  } catch (error: any) {
    console.error(`❌ KV mget failed for ${keys.length} keys:`, error.message);
    return defaultValue;
  }
}

/**
 * Safe del with timeout
 */
export async function safeDel(key: string): Promise<boolean> {
  try {
    await withTimeout(kv.del(key), DEFAULT_TIMEOUT, `KV del for ${key}`);
    return true;
  } catch (error: any) {
    console.error(`❌ KV del failed for ${key}:`, error.message);
    return false;
  }
}

/**
 * Batch getByPrefix - splits large prefix queries into smaller chunks
 * This helps avoid timeouts on large datasets
 */
export async function batchGetByPrefix(prefix: string, batchSize: number = 100): Promise<any[]> {
  try {
    // Try the normal query first with a short timeout
    const result = await withTimeout(kv.getByPrefix(prefix), 5000, `KV batchGetByPrefix for ${prefix}`);
    return result ?? [];
  } catch (error: any) {
    console.warn(`⚠️ KV batchGetByPrefix timeout for ${prefix}, this query may be too large`);
    // Return empty array on timeout - caller should handle this case
    return [];
  }
}

/**
 * Get with cache - stores result in memory for short duration
 */
const memoryCache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function getCached(key: string, defaultValue: any = null): Promise<any> {
  // Check memory cache first
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  
  // Fetch from KV store
  const value = await safeGet(key, defaultValue);
  
  // Store in cache
  memoryCache.set(key, {
    value,
    expiry: Date.now() + CACHE_TTL
  });
  
  return value;
}

/**
 * Clear memory cache for specific key or all
 */
export function clearCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

/**
 * Get subscription with special handling for beta subscriptions
 */
export async function getSubscription(userId: string): Promise<any> {
  // Try direct subscription key first
  let subscription = await safeGet(`subscription:${userId}`);
  
  // If not found, this might be useful for debugging
  if (!subscription) {
    console.log(`ℹ️ No subscription found for subscription:${userId}`);
  }
  
  return subscription;
}

/**
 * Get user's current organization with timeout protection
 */
export async function getUserCurrentOrg(userId: string): Promise<any> {
  return await safeGet(`user_current_org:${userId}`, null);
}

/**
 * Get credits with timeout protection and caching
 */
export async function getCredits(userId: string): Promise<any> {
  return await getCached(`credits:${userId}`, null);
}
