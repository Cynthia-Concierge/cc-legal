import React, { useState } from 'react';
import { Zap, Lock, Shield } from 'lucide-react';

interface GymLeadFormProps {
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

// Phone validation function
function isValidPhone(phone: string, countryCode: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    if (countryCode === "+1") {
        return cleaned.length === 10;
    }
    return cleaned.length >= 7 && cleaned.length <= 15;
}

// Format phone number
function formatPhoneNumber(value: string, countryCode: string): string {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";

    if (countryCode === "+1") {
        if (cleaned.length <= 3) return `(${cleaned}`;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    return cleaned;
}

const GymLeadForm: React.FC<GymLeadFormProps> = ({ onSubmit }) => {
    const [phoneValue, setPhoneValue] = useState("");
    const [countryCode, setCountryCode] = useState("+1");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const formatted = formatPhoneNumber(input, countryCode);
        setPhoneValue(formatted);
        setPhoneError("");
    };

    const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        const cleaned = phoneValue.replace(/\D/g, "");
        const reformatted = formatPhoneNumber(cleaned, newCode);
        setPhoneValue(reformatted);
        setPhoneError("");
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailError("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = (formData.get("name") as string).trim();
        const email = (formData.get("email") as string).trim();
        const phoneInput = phoneValue.trim();
        const website = (formData.get("website") as string).trim();

        if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (!isValidPhone(phoneInput, countryCode)) {
            if (countryCode === "+1") {
                setPhoneError("Please enter a valid 10-digit phone number.");
            } else {
                setPhoneError("Please enter a valid phone number.");
            }
            return;
        }

        setEmailError("");
        setPhoneError("");

        const cleaned = phoneInput.replace(/\D/g, "");
        const phone = `${countryCode}${cleaned}`;

        onSubmit({ name, email, phone, website });
    };

    return (
        <div className="relative" id="enter-your-info-form">
            {/* Absolute positioned "Get Instant Access" hint */}
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none transform -rotate-12">
                <div className="text-blue-400 font-handwriting text-2xl font-bold whitespace-nowrap">Get Instant Access</div>
                <svg className="w-16 h-8 text-blue-400/50 absolute top-full left-1/2 -translate-x-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 137 65">
                    <path stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" d="M10,10 Q60,60 120,30" />
                    <path stroke="currentColor" strokeWidth="2" d="M115,25 L120,30 L115,35" />
                </svg>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 p-6 md:p-8 rounded-lg shadow-2xl relative overflow-hidden">

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide">
                            Enter Your Info
                        </h3>
                        <Shield className="w-5 h-5 text-blue-500" />
                    </div>

                    <div className="mb-6 flex">
                        <div className="w-1 bg-blue-600 rounded-full mr-4 shrink-0"></div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Instant access to the 2025 Gym Legal Pack plus exclusive bonuses worth <span className="font-bold text-white">$3,999</span>.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="group space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name*</label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Your full name"
                                className="w-full px-4 py-3 bg-[#0B0F19] rounded border border-slate-800 focus:border-blue-600 outline-none transition-colors text-white placeholder:text-slate-600"
                            />
                        </div>

                        <div className="group space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email*</label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="Your email address"
                                onChange={handleEmailChange}
                                className={`w-full px-4 py-3 bg-[#0B0F19] rounded border ${emailError ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-600"
                                    } outline-none transition-colors text-white placeholder:text-slate-600`}
                            />
                            {emailError && (
                                <p className="mt-1 text-xs text-red-500">{emailError}</p>
                            )}
                        </div>

                        <div className="group space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number*</label>
                            <div className="flex gap-2">
                                <select
                                    value={countryCode}
                                    onChange={handleCountryCodeChange}
                                    className={`px-3 py-3 bg-[#0B0F19] rounded border ${phoneError ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-600"
                                        } outline-none transition-colors text-white text-sm cursor-pointer`}
                                    style={{ minWidth: "90px" }}
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
                                    placeholder={countryCode === "+1" ? "(555) 123-4567" : "Phone number"}
                                    maxLength={countryCode === "+1" ? 14 : 20}
                                    className={`flex-1 px-4 py-3 bg-[#0B0F19] rounded border ${phoneError ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-600"
                                        } outline-none transition-colors text-white placeholder:text-slate-600`}
                                />
                            </div>
                            {phoneError && (
                                <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                            )}
                        </div>

                        <div className="group space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gym / Facility Website*</label>
                            <input
                                type="text"
                                name="website"
                                required
                                placeholder="yourgym.com"
                                pattern=".*"
                                onInvalid={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    const value = target.value.trim();
                                    if (!value) {
                                        target.setCustomValidity("Please enter your website");
                                    } else {
                                        const normalized = value.startsWith("http://") || value.startsWith("https://")
                                            ? value
                                            : `https://${value}`;
                                        try {
                                            new URL(normalized);
                                            target.setCustomValidity("");
                                        } catch {
                                            target.setCustomValidity("Please enter a valid website (e.g., yourgym.com)");
                                        }
                                    }
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    target.setCustomValidity("");
                                }}
                                className="w-full px-4 py-3 bg-[#0B0F19] rounded border border-slate-800 focus:border-blue-600 outline-none transition-colors text-white placeholder:text-slate-600"
                            />
                        </div>

                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 px-6 rounded shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group mt-6 uppercase tracking-wider text-sm">
                            <Zap className="w-4 h-4 fill-white animate-pulse" />
                            <span>Send Me The Docs</span>
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[9px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
                            <Lock className="w-3 h-3" />
                            <span>256-Bit SSL Encrypted & Secure</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GymLeadForm;
