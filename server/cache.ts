/**
 * Cache Utility Module
 * 
 * Provides Redis caching functions with automatic fallback to in-memory cache
 * when Redis is unavailable. Helps reduce database load and improve response times.
 * 
 * Usage:
 * ```typescript
 * import { cache } from './cache';
 * 
 * // Get from cache
 * const data = await cache.get('products:list');
 * 
 * // Set with 5 minute TTL
 * await cache.set('products:list', products, 300);
 * 
 * // Delete
 * await cache.del('products:*');
 * ```
 */

import { redis } from './redis';
import { log } from './vite';

// In-memory fallback cache (used when Redis unavailable)
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Cache configuration
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute - frequently changing data
  MEDIUM: 300,      // 5 minutes - moderately changing data
  LONG: 1800,       // 30 minutes - rarely changing data
  VERY_LONG: 3600,  // 1 hour - static data
} as const;

// Cache key prefixes for organization
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCTS_LIST: 'products:list',
  PRODUCT: (id: number) => `product:${id}`,
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_WIDGETS: (userId: number) => `dashboard:widgets:${userId}`,
  SALES_TODAY: (userId: number) => `sales:today:${userId}`,
  LOW_STOCK: (userId: number) => `stock:low:${userId}`,
  VENDORS: 'vendors:list',
  VENDOR: (id: number) => `vendor:${id}`,
  RESELLERS: 'resellers:list',
  CUSTOMERS: 'customers:list',
} as const;

/**
 * Get value from cache (Redis first, then memory fallback)
 */
export async function get<T = any>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (redis) {
      const value = await redis.get(key);
      if (value) {
        log(`[Cache] HIT (Redis): ${key}`);
        return JSON.parse(value) as T;
      }
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached) {
      if (Date.now() < cached.expiresAt) {
        log(`[Cache] HIT (Memory): ${key}`);
        return cached.value as T;
      } else {
        // Expired, remove it
        memoryCache.delete(key);
      }
    }

    log(`[Cache] MISS: ${key}`);
    return null;
  } catch (error) {
    log(`[Cache] ERROR getting ${key}: ${error}`);
    return null;
  }
}

/**
 * Set value in cache with TTL (in seconds)
 */
export async function set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
  try {
    const serialized = JSON.stringify(value);

    // Set in Redis if available
    if (redis) {
      await redis.setEx(key, ttl, serialized); // Use setEx (capital E) for Redis v4+
      log(`[Cache] SET (Redis): ${key} (TTL: ${ttl}s)`);
    }

    // Always set in memory cache as fallback
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });
    log(`[Cache] SET (Memory): ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    log(`[Cache] ERROR setting ${key}: ${error}`);
  }
}

/**
 * Delete key(s) from cache
 * Supports wildcard patterns like "products:*"
 */
export async function del(pattern: string): Promise<void> {
  try {
    // Delete from Redis
    if (redis) {
      if (pattern.includes('*')) {
        // Pattern matching - get all keys and delete
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          log(`[Cache] DEL (Redis): ${keys.length} keys matching ${pattern}`);
        }
      } else {
        // Single key
        await redis.del(pattern);
        log(`[Cache] DEL (Redis): ${pattern}`);
      }
    }

    // Delete from memory cache
    if (pattern.includes('*')) {
      // Pattern matching
      const prefix = pattern.replace('*', '');
      const keysToDelete = Array.from(memoryCache.keys()).filter(k => k.startsWith(prefix));
      keysToDelete.forEach(k => memoryCache.delete(k));
      log(`[Cache] DEL (Memory): ${keysToDelete.length} keys matching ${pattern}`);
    } else {
      // Single key
      memoryCache.delete(pattern);
      log(`[Cache] DEL (Memory): ${pattern}`);
    }
  } catch (error) {
    log(`[Cache] ERROR deleting ${pattern}: ${error}`);
  }
}

/**
 * Check if key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  try {
    // Check Redis first
    if (redis) {
      const exists = await redis.exists(key);
      return exists === 1;
    }

    // Check memory cache
    const cached = memoryCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return true;
    }

    return false;
  } catch (error) {
    log(`[Cache] ERROR checking ${key}: ${error}`);
    return false;
  }
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAll(): Promise<void> {
  try {
    // Clear Redis cache
    if (redis) {
      await redis.flushdb();
      log('[Cache] CLEARED all Redis cache');
    }

    // Clear memory cache
    memoryCache.clear();
    log('[Cache] CLEARED all memory cache');
  } catch (error) {
    log(`[Cache] ERROR clearing all: ${error}`);
  }
}

/**
 * Get cache statistics
 */
export function getStats() {
  return {
    memoryKeys: memoryCache.size,
    redisAvailable: !!redis,
  };
}

/**
 * Helper: Wrap async function with caching
 * 
 * Example:
 * const getProducts = cached('products:list', async () => {
 *   return await db.query.products.findMany();
 * }, CACHE_TTL.MEDIUM);
 */
export function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): () => Promise<T> {
  return async () => {
    // Try to get from cache first
    const cached = await get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function
    const result = await fn();
    
    // Store in cache
    await set(key, result, ttl);
    
    return result;
  };
}

// Export as default object
export const cache = {
  get,
  set,
  del,
  exists,
  clearAll,
  getStats,
  cached,
  TTL: CACHE_TTL,
  KEYS: CACHE_KEYS,
};

export default cache;
