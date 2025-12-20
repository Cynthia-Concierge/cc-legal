/**
 * Country Detection Utility
 * Auto-detects user's country for phone input
 * Uses IP geolocation → browser locale → US fallback
 */

const COUNTRY_CACHE_KEY = 'detected_country';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CountryCache {
  country: string;
  timestamp: number;
}

/**
 * Detect user's country code
 * Order: Cached → IP geolocation → Browser locale → US default
 * @returns 2-letter ISO country code (e.g., 'US', 'GB', 'FR')
 */
export async function detectUserCountry(): Promise<string> {
  try {
    // 1. Check cache first (performance optimization)
    const cached = getCachedCountry();
    if (cached) {
      return cached;
    }

    // 2. Try IP geolocation via backend API
    const ipCountry = await detectFromIP();
    if (ipCountry) {
      setCachedCountry(ipCountry);
      return ipCountry;
    }

    // 3. Fallback to browser locale
    const localeCountry = detectFromBrowserLocale();
    if (localeCountry) {
      setCachedCountry(localeCountry);
      return localeCountry;
    }

    // 4. Final fallback: US
    const defaultCountry = 'US';
    setCachedCountry(defaultCountry);
    return defaultCountry;
  } catch (error) {
    console.error('[CountryDetection] Error detecting country:', error);
    return 'US'; // Always return a valid country
  }
}

/**
 * Detect country from IP using backend API
 */
async function detectFromIP(): Promise<string | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/detect-country`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.country && isValidCountryCode(data.country)) {
      return data.country;
    }

    return null;
  } catch (error) {
    console.warn('[CountryDetection] IP detection failed:', error);
    return null;
  }
}

/**
 * Detect country from browser locale (navigator.language)
 * Examples: 'en-US' → 'US', 'en-GB' → 'GB', 'fr-FR' → 'FR'
 */
function detectFromBrowserLocale(): string | null {
  try {
    const locale = navigator.language || navigator.languages?.[0];
    if (!locale) return null;

    // Extract country code from locale (e.g., 'en-US' → 'US')
    const parts = locale.split('-');
    if (parts.length === 2) {
      const countryCode = parts[1].toUpperCase();
      if (isValidCountryCode(countryCode)) {
        return countryCode;
      }
    }

    return null;
  } catch (error) {
    console.warn('[CountryDetection] Locale detection failed:', error);
    return null;
  }
}

/**
 * Get cached country from sessionStorage
 */
function getCachedCountry(): string | null {
  try {
    const cached = sessionStorage.getItem(COUNTRY_CACHE_KEY);
    if (!cached) return null;

    const data: CountryCache = JSON.parse(cached);

    // Check if cache is still valid
    const age = Date.now() - data.timestamp;
    if (age < CACHE_DURATION) {
      return data.country;
    }

    // Cache expired, remove it
    sessionStorage.removeItem(COUNTRY_CACHE_KEY);
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Cache country in sessionStorage
 */
function setCachedCountry(country: string): void {
  try {
    const data: CountryCache = {
      country,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(COUNTRY_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silent fail - caching is optional
  }
}

/**
 * Validate 2-letter country code
 */
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Clear cached country (useful for testing or forced refresh)
 */
export function clearCountryCache(): void {
  try {
    sessionStorage.removeItem(COUNTRY_CACHE_KEY);
  } catch (error) {
    // Silent fail
  }
}
