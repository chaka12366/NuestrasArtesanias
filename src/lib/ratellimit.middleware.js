/**
 * Rate Limit Middleware — Client-side request throttling.
 * Prevents excessive API calls (e.g. rapid clicks, scroll-triggered fetches)
 * by enforcing a per-key rate limit with a sliding window.
 *
 * Usage:
 *   import { rateLimiter } from './ratellimit.middleware.js'
 *
 *   // Returns true if the request is allowed, false if rate-limited
 *   if (!rateLimiter.allow('search')) {
 *     console.warn('Too many requests, please wait...')
 *     return
 *   }
 */

const DEFAULT_MAX_REQUESTS = 30      // max requests per window
const DEFAULT_WINDOW_MS    = 60_000  // 1 minute sliding window
const CLEANUP_INTERVAL     = 120_000 // clean up stale buckets every 2 min

class RateLimiter {
  constructor() {
    /** @type {Map<string, { timestamps: number[], blocked: boolean, cooldownEnd: number }>} */
    this._buckets = new Map()

    // Periodic cleanup of stale buckets
    this._cleanupTimer = typeof setInterval !== 'undefined'
      ? setInterval(() => this._cleanup(), CLEANUP_INTERVAL)
      : null
  }

  /**
   * Check if a request to the given key is allowed.
   * @param {string} key — The action/resource being rate-limited (e.g. 'search', 'fetchProducts')
   * @param {Object} [options]
   * @param {number} [options.maxRequests] — Max requests allowed in the window
   * @param {number} [options.windowMs]   — Window duration in ms
   * @param {number} [options.cooldownMs] — How long to block after hitting the limit (default: 5s)
   * @returns {boolean} — true if allowed, false if rate-limited
   */
  allow(key, options = {}) {
    const {
      maxRequests = DEFAULT_MAX_REQUESTS,
      windowMs    = DEFAULT_WINDOW_MS,
      cooldownMs  = 5000,
    } = options

    const now = Date.now()
    let bucket = this._buckets.get(key)

    if (!bucket) {
      bucket = { timestamps: [], blocked: false, cooldownEnd: 0 }
      this._buckets.set(key, bucket)
    }

    // If currently in cooldown, reject
    if (bucket.blocked && now < bucket.cooldownEnd) {
      return false
    }

    // Exit cooldown if time has passed
    if (bucket.blocked && now >= bucket.cooldownEnd) {
      bucket.blocked = false
      bucket.timestamps = []
    }

    // Remove timestamps outside the current window
    bucket.timestamps = bucket.timestamps.filter(t => (now - t) < windowMs)

    // Check limit
    if (bucket.timestamps.length >= maxRequests) {
      bucket.blocked = true
      bucket.cooldownEnd = now + cooldownMs
      return false
    }

    // Allow the request
    bucket.timestamps.push(now)
    return true
  }

  /**
   * Wrap an async function with rate limiting.
   * If the rate limit is exceeded, returns a rejected promise or the fallback value.
   * @param {string} key
   * @param {Function} fn — The async function to execute
   * @param {Object} [options]
   * @param {any} [options.fallback] — Value to return when rate-limited (default: throws)
   * @param {number} [options.maxRequests]
   * @param {number} [options.windowMs]
   * @returns {Function} — A rate-limited version of the function
   */
  wrap(key, fn, options = {}) {
    const { fallback, ...limitOptions } = options

    return async (...args) => {
      if (!this.allow(key, limitOptions)) {
        if (fallback !== undefined) {
          return typeof fallback === 'function' ? fallback() : fallback
        }
        throw new RateLimitError(`Rate limit exceeded for "${key}"`)
      }
      return fn(...args)
    }
  }

  /**
   * Create a debounced & rate-limited version of a fetch function.
   * Ideal for search inputs — waits for the user to stop typing,
   * then checks rate limits before executing.
   * @param {string} key
   * @param {Function} fn
   * @param {number} [debounceMs=300]
   * @param {Object} [limitOptions]
   * @returns {{ execute: Function, cancel: Function }}
   */
  debouncedWrap(key, fn, debounceMs = 300, limitOptions = {}) {
    let timer = null

    const cancel = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const execute = (...args) => {
      cancel()
      return new Promise((resolve, reject) => {
        timer = setTimeout(async () => {
          if (!this.allow(key, limitOptions)) {
            reject(new RateLimitError(`Rate limit exceeded for "${key}"`))
            return
          }
          try {
            resolve(await fn(...args))
          } catch (err) {
            reject(err)
          }
        }, debounceMs)
      })
    }

    return { execute, cancel }
  }

  /**
   * Get remaining requests for a key in the current window.
   */
  remaining(key, maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS) {
    const bucket = this._buckets.get(key)
    if (!bucket) return maxRequests

    const now = Date.now()
    const active = bucket.timestamps.filter(t => (now - t) < windowMs)
    return Math.max(0, maxRequests - active.length)
  }

  /**
   * Reset a specific key's rate limit bucket.
   */
  reset(key) {
    this._buckets.delete(key)
  }

  /**
   * Clean up stale buckets (no activity in 2x the default window).
   */
  _cleanup() {
    const now = Date.now()
    const staleThreshold = DEFAULT_WINDOW_MS * 2

    for (const [key, bucket] of this._buckets) {
      const latest = bucket.timestamps[bucket.timestamps.length - 1] || 0
      if ((now - latest) > staleThreshold && !bucket.blocked) {
        this._buckets.delete(key)
      }
    }
  }

  /**
   * Dispose the rate limiter (clear interval timer).
   */
  dispose() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer)
      this._cleanupTimer = null
    }
    this._buckets.clear()
  }
}

/**
 * Custom error class for rate-limit rejections.
 */
export class RateLimitError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Singleton instance used across the app
export const rateLimiter = new RateLimiter()

// Pre-configured limits for different operations
export const RATE_LIMITS = {
  SEARCH:        { maxRequests: 20, windowMs: 60_000, cooldownMs: 3000 },
  FETCH_PAGE:    { maxRequests: 40, windowMs: 60_000, cooldownMs: 2000 },
  ADD_TO_CART:   { maxRequests: 15, windowMs: 60_000, cooldownMs: 5000 },
  PLACE_ORDER:   { maxRequests: 5,  windowMs: 60_000, cooldownMs: 10_000 },
  AUTH:          { maxRequests: 10, windowMs: 60_000, cooldownMs: 15_000 },
}
