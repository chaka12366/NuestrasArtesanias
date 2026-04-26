import { fetchStoreSettings } from '../lib/dashboard.js';

/**
 * Shared store settings cache with TTL.
 * Prevents duplicate Supabase calls across Navbar, Footer, Dashboard, etc.
 * Cache is valid for 5 minutes (300,000 ms).
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _cache = null;
let _cacheTime = 0;
let _pendingPromise = null;

const DEFAULTS = {
  name: 'Nuestras Artesanías',
  tagline: 'Handcrafted & Authentic',
  whatsapp: '+501-623-3964',
  instagram: '@_nuestrasartesanias_',
  email: 'nuestrasartesanias@gmail.com',
  phone: '+501 600-0000',
  address: 'Corozal Town, Belize',
  currency: 'BZD',
  shipping_zones: 'Countrywide',
  theme: 'warm',
  cardStyle: 'rounded',
  showTopbar: 'true',
  showRatings: 'true',
};

/**
 * Get store settings, using cache if available and fresh.
 * Deduplicates concurrent calls (only 1 network request at a time).
 * @returns {Promise<Object>}
 */
export async function getStoreSettings() {
  const now = Date.now();

  // Return cached data if it's still fresh
  if (_cache && (now - _cacheTime) < CACHE_TTL) {
    return _cache;
  }

  // If there's already a pending request, wait for it (dedup)
  if (_pendingPromise) {
    return _pendingPromise;
  }

  // Start a fresh fetch
  _pendingPromise = fetchStoreSettings()
    .then(data => {
      const settings = { ...DEFAULTS, ...data };
      _cache = settings;
      _cacheTime = Date.now();

      // Also update localStorage for instant hydration on next page load
      try {
        localStorage.setItem('storeSettings', JSON.stringify(settings));
      } catch { /* quota exceeded — ignore */ }

      return settings;
    })
    .catch(err => {
      console.error('Failed to fetch store settings:', err);
      // Fall back to localStorage or defaults
      try {
        const cached = localStorage.getItem('storeSettings');
        if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
      } catch { /* ignore */ }
      return DEFAULTS;
    })
    .finally(() => {
      _pendingPromise = null;
    });

  return _pendingPromise;
}

/**
 * Get store settings synchronously from cache/localStorage.
 * Returns defaults if nothing is cached.
 * Useful for initial render before async fetch completes.
 */
export function getStoreSettingsSync() {
  if (_cache) return _cache;
  try {
    const cached = localStorage.getItem('storeSettings');
    if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

/**
 * Force-refresh the cache (e.g., after settings are saved).
 */
export function invalidateStoreSettings() {
  _cache = null;
  _cacheTime = 0;
}
