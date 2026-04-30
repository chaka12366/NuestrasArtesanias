import { fetchStoreSettings } from '../lib/dashboard.js';

const CACHE_TTL = 5 * 60 * 1000;

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

export async function getStoreSettings() {
  const now = Date.now();

  if (_cache && (now - _cacheTime) < CACHE_TTL) {
    return _cache;
  }

  if (_pendingPromise) {
    return _pendingPromise;
  }

  _pendingPromise = fetchStoreSettings()
    .then(data => {
      const settings = { ...DEFAULTS, ...data };
      _cache = settings;
      _cacheTime = Date.now();

      try {
        localStorage.setItem('storeSettings', JSON.stringify(settings));
      } catch {  }

      return settings;
    })
    .catch(err => {
      console.error('Failed to fetch store settings:', err);

      try {
        const cached = localStorage.getItem('storeSettings');
        if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
      } catch {  }
      return DEFAULTS;
    })
    .finally(() => {
      _pendingPromise = null;
    });

  return _pendingPromise;
}

export function getStoreSettingsSync() {
  if (_cache) return _cache;
  try {
    const cached = localStorage.getItem('storeSettings');
    if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
  } catch {  }
  return DEFAULTS;
}

export function invalidateStoreSettings() {
  _cache = null;
  _cacheTime = 0;
}
