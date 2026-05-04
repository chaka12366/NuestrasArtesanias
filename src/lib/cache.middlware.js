/**
 * Cache Middleware — In-memory TTL cache for Supabase queries.
 * Prevents redundant network requests and speeds up page loads
 * by caching frequently-accessed data (categories, products, etc.)
 *
 * Usage:
 *   import { queryCache } from './cache.middlware.js'
 *
 *   const data = await queryCache.get('categories', fetchCategories, { ttl: 120000 })
 */

const DEFAULT_TTL = 5 * 60 * 1000   // 5 minutes
const MAX_ENTRIES = 100              // prevent unbounded growth
const STALE_WHILE_REVALIDATE = true  // serve stale data while refreshing

class QueryCache {
  constructor() {
    /** @type {Map<string, { data: any, timestamp: number, ttl: number, promise: Promise|null }>} */
    this._store = new Map()
    this._hits = 0
    this._misses = 0
  }

  /**
   * Get cached data or fetch fresh data with the provided fetcher function.
   * @param {string} key — Unique cache key
   * @param {Function} fetcher — Async function that returns the data
   * @param {Object} [options]
   * @param {number} [options.ttl] — Time-to-live in ms (default: 5 min)
   * @param {boolean} [options.forceRefresh] — Skip cache and fetch fresh
   * @param {boolean} [options.staleWhileRevalidate] — Serve stale data while refreshing
   * @returns {Promise<any>}
   */
  async get(key, fetcher, options = {}) {
    const {
      ttl = DEFAULT_TTL,
      forceRefresh = false,
      staleWhileRevalidate = STALE_WHILE_REVALIDATE,
    } = options

    const entry = this._store.get(key)
    const now = Date.now()

    // 1) Fresh cache hit — return immediately
    if (!forceRefresh && entry && (now - entry.timestamp) < entry.ttl) {
      this._hits++
      return entry.data
    }

    // 2) Stale entry exists — return stale data + trigger background revalidation
    if (!forceRefresh && staleWhileRevalidate && entry && entry.data != null) {
      this._hits++

      // If not already revalidating, kick off a background refresh
      if (!entry.promise) {
        entry.promise = this._fetchAndStore(key, fetcher, ttl)
          .catch(err => {
            console.warn(`[Cache] Background revalidation failed for "${key}":`, err.message)
          })
          .finally(() => {
            const e = this._store.get(key)
            if (e) e.promise = null
          })
      }

      return entry.data
    }

    // 3) Cache miss — deduplicate concurrent fetches for the same key
    if (entry?.promise) {
      return entry.promise
    }

    this._misses++
    const promise = this._fetchAndStore(key, fetcher, ttl)

    // Store the in-flight promise so concurrent calls share the same fetch
    this._store.set(key, {
      data: entry?.data ?? null,
      timestamp: entry?.timestamp ?? 0,
      ttl,
      promise,
    })

    return promise
  }

  /**
   * Internal: fetch data, store it, and enforce max-entries eviction.
   */
  async _fetchAndStore(key, fetcher, ttl) {
    const data = await fetcher()

    this._store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      promise: null,
    })

    // Evict oldest entries if over the limit
    if (this._store.size > MAX_ENTRIES) {
      this._evictOldest()
    }

    return data
  }

  /**
   * Evict entries that are oldest / most expired.
   */
  _evictOldest() {
    const now = Date.now()
    let oldestKey = null
    let oldestAge = -1

    for (const [k, v] of this._store) {
      const age = now - v.timestamp
      if (age > oldestAge) {
        oldestAge = age
        oldestKey = k
      }
    }

    if (oldestKey) {
      this._store.delete(oldestKey)
    }
  }

  /**
   * Create a parameterized cache key.
   * @param {string} prefix
   * @param  {...any} params
   * @returns {string}
   */
  key(prefix, ...params) {
    return `${prefix}:${params.map(p => JSON.stringify(p)).join(':')}`
  }

  /**
   * Invalidate a specific cache entry by key.
   */
  invalidate(key) {
    this._store.delete(key)
  }

  /**
   * Invalidate all entries whose key starts with the given prefix.
   */
  invalidatePrefix(prefix) {
    for (const k of this._store.keys()) {
      if (k.startsWith(prefix)) {
        this._store.delete(k)
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this._store.clear()
    this._hits = 0
    this._misses = 0
  }

  /**
   * Warm the cache by pre-fetching critical data in parallel.
   * Call this once during app initialization to pre-populate caches
   * for the most common pages.
   * @param {Array<{key: string, fetcher: Function, ttl?: number}>} entries
   */
  async warmup(entries) {
    await Promise.allSettled(
      entries.map(({ key, fetcher, ttl }) =>
        this.get(key, fetcher, { ttl: ttl || DEFAULT_TTL })
      )
    )
  }

  /**
   * Return hit/miss stats for debugging.
   */
  stats() {
    const total = this._hits + this._misses
    return {
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + '%' : '0%',
      entries: this._store.size,
    }
  }
}

// Singleton instance used across the app
export const queryCache = new QueryCache()

// Pre-defined TTLs for different data types
export const CACHE_TTL = {
  CATEGORIES:       10 * 60 * 1000,  // 10 min — categories rarely change
  FEATURED:          5 * 60 * 1000,  //  5 min
  PRODUCTS_BY_CAT:   3 * 60 * 1000,  //  3 min
  PRODUCT_DETAIL:    2 * 60 * 1000,  //  2 min
  PRODUCT_IMAGES:    5 * 60 * 1000,  //  5 min
  SEARCH:            1 * 60 * 1000,  //  1 min — searches are dynamic
  STORE_SETTINGS:    5 * 60 * 1000,  //  5 min
}
