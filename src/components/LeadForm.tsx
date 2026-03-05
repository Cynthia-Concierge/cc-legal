import React, { useState } from 'react';
import { Zap, Lock, Shield } from 'lucide-react';
import { PhoneInput } from './ui/phone-input';

interface LeadFormProps {
  onSubmit: (formData: {
    name: string;
    email: string;
    phone: string;
    instagram_handle: string;
    consentSms: boolean;
    consentEmail: boolean;
  }) => void;
}

// Email validation function
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [consentSmsEmail, setConsentSmsEmail] = useState(false);
  const [consentError, setConsentError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailError(""); // Clear error on input
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setPhoneError(""); // Clear error on input
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const instagram_handle = (formData.get("instagram_handle") as string).trim();

    // Validate email
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    // Validate phone (must be in E.164 format from PhoneInput)
    if (!phone || phone.length < 10) {
      setPhoneError("Please enter a valid phone number.");
      return;
    }

    if (!consentSmsEmail) {
      setConsentError("Please agree to receive email and SMS to continue.");
      return;
    }

    setEmailError("");
    setPhoneError("");
    setConsentError("");

    onSubmit({ name, email, phone, instagram_handle, consentSms: true, consentEmail: true });
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
              className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 text-base placeholder:text-slate-400"
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
                } focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 text-base placeholder:text-slate-400`}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Phone Number*</label>
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              error={phoneError}
              className="px-4 py-3.5 bg-slate-50 focus:bg-white text-slate-900 text-base placeholder:text-slate-400"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide group-focus-within:text-emerald-600 transition-colors">Instagram handle*</label>
            <input
              type="text"
              name="instagram_handle"
              required
              placeholder="@yourhandle"
              onInvalid={(e) => {
                const target = e.target as HTMLInputElement;
                if (!target.value.trim()) {
                  target.setCustomValidity("Please enter your Instagram handle");
                } else {
                  target.setCustomValidity("");
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.setCustomValidity("");
              }}
              className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 text-base placeholder:text-slate-400"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-3 cursor-pointer group/check">
              <input
                type="checkbox"
                checked={consentSmsEmail}
                onChange={(e) => {
                  setConsentSmsEmail(e.target.checked);
                  setConsentError("");
                }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-600 group-hover/check:text-slate-700">
                I agree to receive email and SMS updates and marketing from CC Legal at the contact info provided.
              </span>
            </label>
            {consentError && (
              <p className="text-xs text-red-600 mt-1.5">{consentError}</p>
            )}
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

