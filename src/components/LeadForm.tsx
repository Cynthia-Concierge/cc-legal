import React, { useState } from 'react';
import { Zap, Lock, Shield } from 'lucide-react';

interface LeadFormProps {
  onSubmit: (formData: {
    name: string;
    email: string;
    phone: string;
    website: string;
  }) => void;
}

// Email validation function
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Common country codes
const COUNTRY_CODES = [
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

// Phone validation function - requires 10 digits for US, or valid international format
function isValidPhone(phone: string, countryCode: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // For US/Canada (+1), require exactly 10 digits
  if (countryCode === "+1") {
    return cleaned.length === 10;
  }
  // For other countries, require at least 7 digits (minimum for most countries)
  return cleaned.length >= 7 && cleaned.length <= 15;
}

// Format phone number as user types: (555) 123-4567 for US, or just digits for others
function formatPhoneNumber(value: string, countryCode: string): string {
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

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [phoneValue, setPhoneValue] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input, countryCode);
    setPhoneValue(formatted);
    setPhoneError(""); // Clear error on input
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    // Reformat phone number with new country code
    const cleaned = phoneValue.replace(/\D/g, "");
    const reformatted = formatPhoneNumber(cleaned, newCode);
    setPhoneValue(reformatted);
    setPhoneError(""); // Clear error on change
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailError(""); // Clear error on input
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const phoneInput = phoneValue.trim();
    const website = (formData.get("website") as string).trim();

    // Validate email
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    // Validate phone
    if (!isValidPhone(phoneInput, countryCode)) {
      if (countryCode === "+1") {
        setPhoneError("Please enter a valid 10-digit phone number.");
      } else {
        setPhoneError("Please enter a valid phone number.");
      }
      return;
    }

    // Clear any previous errors
    setEmailError("");
    setPhoneError("");

    // Clean phone number (remove formatting) and prepend country code before submitting
    const cleaned = phoneInput.replace(/\D/g, "");
    const phone = `${countryCode}${cleaned}`;

    onSubmit({ name, email, phone, website });
  };

  return (
    <div className="bg-white/80 border border-white/50 p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] backdrop-blur-xl relative overflow-hidden ring-1 ring-slate-900/5" id="enter-your-info-form">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900 font-serif">
            Enter Your Info
          </h3>
          <Shield className="w-5 h-5 text-emerald-500 opacity-50" />
        </div>

        <p className="text-slate-600 mb-8 text-sm leading-relaxed border-l-4 border-emerald-200 pl-4 py-1">
          Instant access to all essential legal documents plus exclusive bonuses worth <span className="font-bold text-emerald-700">$3,999</span>.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Name*</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Your full name"
              className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Email*</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Your email address"
              onChange={handleEmailChange}
              className={`w-full px-4 py-3.5 rounded-lg border ${emailError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"
                } focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400`}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Phone Number*</label>
            <div className="flex gap-2 overflow-hidden">
              <select
                value={countryCode}
                onChange={handleCountryCodeChange}
                className={`px-3 py-3.5 rounded-lg border ${phoneError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"
                  } focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 font-medium text-sm cursor-pointer flex-shrink-0`}
                style={{ minWidth: "100px" }}
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="phone"
                required
                value={phoneValue}
                onChange={handlePhoneChange}
                placeholder={countryCode === "+1" ? "(555) 123-4567" : "Enter phone number"}
                maxLength={countryCode === "+1" ? 14 : 20}
                className={`flex-1 min-w-0 px-4 py-3.5 rounded-lg border ${phoneError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"
                  } focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400`}
                style={{ 
                  textAlign: 'left',
                  direction: 'ltr'
                }}
                onFocus={(e) => {
                  // Prevent horizontal scrolling by scrolling the input to the start
                  const input = e.target;
                  input.scrollLeft = 0;
                  // Position cursor at end to prevent any scroll behavior
                  if (input.value) {
                    setTimeout(() => {
                      input.setSelectionRange(input.value.length, input.value.length);
                    }, 0);
                  }
                }}
              />
            </div>
            {phoneError && (
              <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Website*</label>
            <input
              type="text"
              name="website"
              required
              placeholder="yourwebsite.com"
              pattern=".*"
              onInvalid={(e) => {
                const target = e.target as HTMLInputElement;
                const value = target.value.trim();
                if (!value) {
                  target.setCustomValidity("Please enter your website");
                } else {
                  // Normalize and validate
                  const normalized = value.startsWith("http://") || value.startsWith("https://")
                    ? value
                    : `https://${value}`;
                  try {
                    new URL(normalized);
                    target.setCustomValidity("");
                  } catch {
                    target.setCustomValidity("Please enter a valid website (e.g., yourwebsite.com)");
                  }
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.setCustomValidity("");
              }}
              className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group mt-4">
            <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Yes! Give Me The Documents!</span>
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>256-Bit SSL Encrypted & Secure</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;

