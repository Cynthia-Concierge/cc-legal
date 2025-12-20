/**
 * IP Geolocation Utilities
 * Uses geoip-lite for offline IP to country code lookups
 */

import * as geoip from 'geoip-lite';

/**
 * Get country code from IP address
 * @param ip - IP address (IPv4 or IPv6)
 * @returns 2-letter ISO country code (e.g., 'US', 'GB', 'FR') or 'US' as default
 */
export function getCountryFromIP(ip: string): string {
  try {
    // Handle localhost/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return 'US'; // Default for local development
    }

    const geo = geoip.lookup(ip);

    if (geo && geo.country) {
      return geo.country; // Returns 2-letter code like 'US', 'GB', 'FR'
    }

    // Default to US if lookup fails
    return 'US';
  } catch (error) {
    console.error('[GeoUtils] Error looking up IP:', error);
    return 'US';
  }
}

/**
 * Get the real IP address from the request
 * Handles proxies, load balancers, and Cloudflare
 * @param req - Express request object
 * @returns IP address string
 */
export function getRealIP(req: any): string {
  // Check for Cloudflare header first
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) return Array.isArray(cfIP) ? cfIP[0] : cfIP;

  // Check X-Forwarded-For (used by most proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim(); // First IP is the client
  }

  // Check other common headers
  const realIP = req.headers['x-real-ip'];
  if (realIP) return Array.isArray(realIP) ? realIP[0] : realIP;

  // Fallback to req.ip or socket address
  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}
