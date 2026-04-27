/**
 * KV Store Cache Wrapper
 * Adds in-memory caching and timeout handling to prevent database timeouts
 * Implements concurrency limiting to prevent WORKER_LIMIT errors
 */

import * as kv from './kv_store.tsx';

// In-memory cache with TTL
const cache = new Map<string, { value: any; expiry: number }>();
// Cache for prefix queries with their own TTL
const prefixCache = new Map<string, { value: any[]; expiry: number }>();

const CACHE_TTL = 300000; // 5 minutes (increased from 2)
const LONG_CACHE_TTL = 900000; // 15 minutes (increased from 5)
const QUERY_TIMEOUT = 25000; // 25 seconds timeout (increased from 15s to handle load)
const PREFIX_QUERY_TIMEOUT = 30000; // 30 seconds for prefix queries
const PREFIX_CACHE_TTL = 300000; // 5 minutes for prefix queries

// Keys that should use longer cache TTL
const LONG_CACHE_KEYS = [
  'credits:',
  ':plan',
  ':subscriptions',
  'user_organizations:',
  'user_notifications:',
  'founder_call_availability',
  'org_',
];

/**
 * Simple Semaphore implementation for concurrency limiting
 */
class Semaphore {
  private tasks: (() => void)[] = [];
  private count: number;

  constructor(private max: number) {
    this.count = max;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.tasks.push(resolve);
    });
  }

  release(): void {
    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      if (next) next();
    } else {
      this.count++;
    }
  }
}

// Global semaphore for KV operations
// Limit to 20 concurrent operations to stay safely under worker limits
const kvSemaphore = new Semaphore(20);

// Helper to run with semaphore
async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  await kvSemaphore.acquire();
  try {
    return await fn();
  } finally {
    kvSemaphore.release();
  }
}

/**
 * Determine if a key should use long cache TTL
 */
function shouldUseLongCache(key: string): boolean {
  return LONG_CACHE_KEYS.some(pattern => key.includes(pattern));
}

/**
 * Clear expired cache entries (both regular and prefix caches)
 */
function clearExpiredCache() {
  const now = Date.now();
  
  // Clear regular cache
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) {
      cache.delete(key);
    }
  }
  
  // Clear prefix cache
  for (const [key, entry] of prefixCache.entries()) {
    if (entry.expiry < now) {
      prefixCache.delete(key);
    }
  }
}

/**
 * Wrap a promise with timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Retry a query with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Get value from cache or KV store with timeout handling and concurrency limiting
 */
export async function get(key: string, useCache = true): Promise<any> {
  // Check cache first
  if (useCache) {
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      console.log(`🎯 Cache hit: ${key}`);
      return cached.value;
    }
  }

  try {
    // Query with timeout and concurrency limit
    const value = await withRetry(
      () => withConcurrencyLimit(() => withTimeout(kv.get(key), QUERY_TIMEOUT))
    );
    
    // Store in cache
    if (useCache && value !== undefined) {
      cache.set(key, {
        value,
        expiry: Date.now() + (shouldUseLongCache(key) ? LONG_CACHE_TTL : CACHE_TTL),
      });
    }
    
    return value;
  } catch (error) {
    // If timeout or error, return cached value if available (even if expired)
    const cached = cache.get(key);
    if (cached) {
      console.log(`💾 Using cached data for ${key} (DB unavailable)`);
      return cached.value;
    }
    
    console.warn(`⚠️ No cached data available for ${key}, returning null. Error: ${error.message}`);
    return null;
  }
}

/**
 * Set value in KV store and cache
 */
export async function set(key: string, value: any): Promise<void> {
  // Update cache immediately
  cache.set(key, {
    value,
    expiry: Date.now() + (shouldUseLongCache(key) ? LONG_CACHE_TTL : CACHE_TTL),
  });

  try {
    // Write to KV store with timeout and concurrency limit
    await withRetry(
      () => withConcurrencyLimit(() => withTimeout(kv.set(key, value), QUERY_TIMEOUT))
    );
  } catch (error) {
    console.error(`❌ KV set failed for ${key}:`, error.message);
    // Don't throw - cache update was successful
  }
}

/**
 * Delete value from KV store and cache
 */
export async function del(key: string): Promise<void> {
  // Remove from cache immediately
  cache.delete(key);

  try {
    // Delete from KV store with timeout and concurrency limit
    await withRetry(
      () => withConcurrencyLimit(() => withTimeout(kv.del(key), QUERY_TIMEOUT))
    );
  } catch (error) {
    console.error(`❌ KV delete failed for ${key}:`, error.message);
    // Don't throw - cache was cleared
  }
}

/**
 * Get multiple values with timeout handling and concurrency limiting
 */
export async function mget(keys: string[], useCache = true): Promise<any[]> {
  const results: any[] = [];
  const uncachedKeys: string[] = [];
  const uncachedIndices: number[] = [];

  // Check cache first
  if (useCache) {
    for (let i = 0; i < keys.length; i++) {
      const cached = cache.get(keys[i]);
      if (cached && cached.expiry > Date.now()) {
        results[i] = cached.value;
      } else {
        uncachedKeys.push(keys[i]);
        uncachedIndices.push(i);
      }
    }
  } else {
    uncachedKeys.push(...keys);
    uncachedIndices.push(...keys.map((_, i) => i));
  }

  // Fetch uncached keys
  if (uncachedKeys.length > 0) {
    try {
      // Chunk keys to avoid too large requests
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < uncachedKeys.length; i += CHUNK_SIZE) {
        chunks.push(uncachedKeys.slice(i, i + CHUNK_SIZE));
      }

      const chunkResults = await Promise.all(chunks.map(chunk => 
        withRetry(
          () => withConcurrencyLimit(() => withTimeout(kv.mget(chunk), QUERY_TIMEOUT))
        )
      ));
      
      // Flatten results
      const values = chunkResults.flat();
      
      for (let i = 0; i < uncachedKeys.length; i++) {
        const key = uncachedKeys[i];
        const value = values[i];
        const index = uncachedIndices[i];
        
        results[index] = value;
        
        // Cache the result
        if (useCache && value !== undefined) {
          cache.set(key, {
            value,
            expiry: Date.now() + (shouldUseLongCache(key) ? LONG_CACHE_TTL : CACHE_TTL),
          });
        }
      }
    } catch (error) {
      console.error(`❌ KV mget failed:`, error.message);
      // Return cached values where available
      for (let i = 0; i < uncachedKeys.length; i++) {
        const key = uncachedKeys[i];
        const index = uncachedIndices[i];
        const cached = cache.get(key);
        results[index] = cached?.value ?? null;
      }
    }
  }

  return results;
}

/**
 * Get values by prefix with timeout handling and caching
 */
export async function getByPrefix(prefix: string, useCache = true): Promise<any[]> {
  // Check prefix cache first
  if (useCache) {
    const cached = prefixCache.get(prefix);
    if (cached && cached.expiry > Date.now()) {
      console.log(`🎯 Prefix cache hit: ${prefix}`);
      return cached.value;
    }
  }

  try {
    // Use longer timeout for credits queries specifically (they can be large)
    const timeout = prefix.includes('credits:') ? 20000 : PREFIX_QUERY_TIMEOUT;
    const result = await withRetry(
      () => withConcurrencyLimit(() => withTimeout(kv.getByPrefix(prefix), timeout))
    );
    
    // Store in prefix cache
    if (useCache && result && result.length > 0) {
      prefixCache.set(prefix, {
        value: result,
        expiry: Date.now() + PREFIX_CACHE_TTL,
      });
      console.log(`💾 Cached ${result.length} items for prefix: ${prefix}`);
    }
    
    return result;
  } catch (error) {
    // If timeout or error, return cached value if available (even if expired)
    const cached = prefixCache.get(prefix);
    if (cached) {
      console.log(`💾 Using cached prefix data for ${prefix} (DB unavailable)`);
      return cached.value;
    }
    
    console.warn(`⚠️ No cached prefix data available for ${prefix}, returning empty array`);
    return [];
  }
}

/**
 * Set multiple values
 */
export async function mset(keys: string[], values: any[]): Promise<void> {
  // Update cache immediately
  for (let i = 0; i < keys.length; i++) {
    cache.set(keys[i], {
      value: values[i],
      expiry: Date.now() + (shouldUseLongCache(keys[i]) ? LONG_CACHE_TTL : CACHE_TTL),
    });
  }

  try {
    // Chunk requests
    const CHUNK_SIZE = 50;
    const keyChunks = [];
    const valueChunks = [];
    
    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      keyChunks.push(keys.slice(i, i + CHUNK_SIZE));
      valueChunks.push(values.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(keyChunks.map((chunkKeys, idx) => 
      withRetry(
        () => withConcurrencyLimit(() => withTimeout(kv.mset(chunkKeys, valueChunks[idx]), QUERY_TIMEOUT))
      )
    ));
  } catch (error) {
    console.error(`❌ KV mset failed:`, error.message);
    // Cache was updated successfully
  }
}

/**
 * Delete multiple values
 */
export async function mdel(keys: string[]): Promise<void> {
  // Remove from cache immediately
  for (const key of keys) {
    cache.delete(key);
  }

  try {
    // Chunk requests
    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      chunks.push(keys.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(chunks.map(chunk => 
      withRetry(
        () => withConcurrencyLimit(() => withTimeout(kv.mdel(chunk), QUERY_TIMEOUT))
      )
    ));
  } catch (error) {
    console.error(`❌ KV mdel failed:`, error.message);
    // Cache was cleared
  }
}

/**
 * Pre-warm cache for a user's critical data
 * This helps prevent timeouts by loading data into cache proactively
 */
export async function prewarmUserCache(userId: string): Promise<void> {
  console.log(`🔥 Pre-warming cache for user ${userId}...`);
  
  const criticalKeys = [
    `credits:${userId}`,
    `credits:${userId}:plan`,
    `user_organizations:${userId}`,
    `user:${userId}:subscriptions`,
    `user_notifications:${userId}`,
  ];

  // Load all critical keys in parallel with retry logic
  const promises = criticalKeys.map(key => 
    withRetry(
      () => withConcurrencyLimit(() => withTimeout(kv.get(key), QUERY_TIMEOUT)),
      2, // 2 retries
      300 // 300ms base delay
    ).then(value => {
      // Cache the value
      if (value !== undefined) {
        cache.set(key, {
          value,
          expiry: Date.now() + LONG_CACHE_TTL,
        });
      }
      return value;
    }).catch(err => {
      console.warn(`⚠️ Failed to prewarm ${key}:`, err.message);
      return null;
    })
  );

  // Don't wait for completion - run in background
  Promise.all(promises).then(() => {
    console.log(`✅ Pre-warming complete for user ${userId}`);
  }).catch(err => {
    console.warn(`⚠️ Pre-warming partially failed for user ${userId}:`, err.message);
  });
}

/**
 * Invalidate cache for specific key or pattern
 */
export function invalidateCache(keyOrPattern: string): void {
  if (keyOrPattern.includes('*')) {
    // Pattern-based invalidation
    const pattern = keyOrPattern.replace('*', '');
    let count = 0;
    
    // Clear from regular cache
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        count++;
      }
    }
    
    // Clear from prefix cache
    for (const key of prefixCache.keys()) {
      if (key.includes(pattern)) {
        prefixCache.delete(key);
        count++;
      }
    }
    
    console.log(`🗑️ Invalidated ${count} cache entries matching pattern: ${keyOrPattern}`);
  } else {
    // Single key invalidation
    cache.delete(keyOrPattern);
    
    // Also clear any prefix cache entries that start with this key
    for (const key of prefixCache.keys()) {
      if (keyOrPattern.startsWith(key) || key.startsWith(keyOrPattern)) {
        prefixCache.delete(key);
      }
    }
    
    console.log(`🗑️ Invalidated cache for: ${keyOrPattern}`);
  }
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats(): { 
  regularCache: { size: number; keys: string[] };
  prefixCache: { size: number; keys: string[] };
} {
  return {
    regularCache: {
      size: cache.size,
      keys: Array.from(cache.keys()),
    },
    prefixCache: {
      size: prefixCache.size,
      keys: Array.from(prefixCache.keys()),
    },
  };
}

/**
 * Check if cache is warmed for a user
 */
export function isCacheWarmed(userId: string): boolean {
  const criticalKeys = [
    `credits:${userId}`,
    `user_organizations:${userId}`,
  ];
  
  return criticalKeys.every(key => {
    const cached = cache.get(key);
    return cached && cached.expiry > Date.now();
  });
}

// Periodically clear expired cache entries
setInterval(clearExpiredCache, 60000); // Every minute
