/**
 * Phone Number Normalization Utilities
 * Uses libphonenumber-js for validation and E.164 normalization
 */

import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalize phone number to E.164 format
 * @param phone - Phone number string (with or without country code)
 * @param countryCode - 2-letter ISO country code (e.g., 'US', 'GB', 'FR')
 * @returns E.164 formatted phone (+15551234567) or null if invalid
 */
export function normalizePhone(phone: string, countryCode: string = 'US'): string | null {
  if (!phone) return null;

  try {
    // Remove whitespace
    const cleaned = phone.trim();

    // Try to parse the phone number
    const phoneNumber = parsePhoneNumber(cleaned, countryCode as CountryCode);

    // Check if valid
    if (phoneNumber && phoneNumber.isValid()) {
      // Return E.164 format: +15551234567
      return phoneNumber.number;
    }

    return null;
  } catch (error) {
    console.error('[PhoneNormalization] Error parsing phone:', error);
    return null;
  }
}

/**
 * Validate if a phone number is valid for a given country
 * @param phone - Phone number string
 * @param countryCode - 2-letter ISO country code
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string, countryCode: string = 'US'): boolean {
  return normalizePhone(phone, countryCode) !== null;
}

/**
 * Format phone number for display (not for storage)
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber) {
      // Format nationally (e.g., "(555) 123-4567" for US)
      return phoneNumber.formatNational();
    }
    return phone;
  } catch (error) {
    return phone;
  }
}
