
export const COUNTRY_CODES = [
    { code: "+1", country: "US/CA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "AU", flag: "🇦🇺" },
    { code: "+33", country: "FR", flag: "🇫🇷" },
    { code: "+49", country: "DE", flag: "🇩🇪" },
    { code: "+81", country: "JP", flag: "🇯🇵" },
    { code: "+86", country: "CN", flag: "🇨🇳" },
    { code: "+91", country: "IN", flag: "🇮🇳" },
    { code: "+52", country: "MX", flag: "🇲🇽" },
    { code: "+55", country: "BR", flag: "🇧🇷" },
];

export function isValidPhone(phone: string, countryCode: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    // For US/Canada (+1), require exactly 10 digits
    if (countryCode === "+1") {
        return cleaned.length === 10;
    }
    // For other countries, require at least 7 digits (minimum for most countries)
    return cleaned.length >= 7 && cleaned.length <= 15;
}

export function formatPhoneNumber(value: string, countryCode: string): string {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";

    // US/Canada formatting
    if (countryCode === "+1") {
        if (cleaned.length <= 3) return `(${cleaned}`;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    // For other countries, just return digits (or add spaces every 3-4 digits)
    return cleaned;
}

export function parsePhoneNumber(fullNumber: string): { countryCode: string; number: string } {
    if (!fullNumber) return { countryCode: "+1", number: "" };

    // Sort codes by length descending to match longest prefix first
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

    for (const country of sortedCodes) {
        if (fullNumber.startsWith(country.code)) {
            const number = fullNumber.slice(country.code.length);
            return { countryCode: country.code, number };
        }
    }

    // Default fallback
    return { countryCode: "+1", number: fullNumber };
}
