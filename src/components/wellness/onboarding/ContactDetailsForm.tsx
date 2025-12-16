import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';
import { UserAnswers } from '../../../types/wellness';
import { COUNTRY_CODES, formatPhoneNumber, parsePhoneNumber } from '../../../utils/phoneUtils';

interface ContactDetailsFormProps {
    answers: UserAnswers;
    onUpdate: (field: keyof UserAnswers, value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const ContactDetailsForm: React.FC<ContactDetailsFormProps> = ({
    answers,
    onUpdate,
    onNext,
    onBack
}) => {
    // Initialize phone state
    const { countryCode: initialCode, number: initialNumber } = parsePhoneNumber(answers.phone || "");
    const [countryCode, setCountryCode] = useState(initialCode);
    const [phoneDisplay, setPhoneDisplay] = useState(formatPhoneNumber(initialNumber, initialCode));

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const formatted = formatPhoneNumber(input, countryCode);
        setPhoneDisplay(formatted);

        const cleaned = input.replace(/\D/g, "");
        onUpdate('phone', `${countryCode}${cleaned}`);
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);

        // Reformat existing number with new code logic
        const cleaned = phoneDisplay.replace(/\D/g, "");
        const formatted = formatPhoneNumber(cleaned, newCode);
        setPhoneDisplay(formatted);

        onUpdate('phone', `${newCode}${cleaned}`);
    };

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col min-h-[calc(100vh-100px)] md:min-h-0">
            <Card className="w-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col md:flex-none">
                <CardHeader>
                    <CardTitle className="text-xl md:text-2xl text-slate-900 text-center font-bold leading-relaxed">
                        Where should we list your business details?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 pb-24 md:pb-6">

                    {/* Owner Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Owner / Representative Name</label>
                        <input
                            type="text"
                            placeholder="Your full name"
                            value={answers.ownerName || ''}
                            onChange={(e) => onUpdate('ownerName', e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Phone Number</label>
                        <div className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={handleCountryChange}
                                className="px-3 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all bg-white text-slate-900 font-medium text-sm cursor-pointer"
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
                                placeholder={countryCode === "+1" ? "(555) 123-4567" : "Enter phone number"}
                                value={phoneDisplay}
                                onChange={handlePhoneChange}
                                maxLength={countryCode === "+1" ? 14 : 20}
                                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Business Address */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Business Address</label>
                        <input
                            type="text"
                            name="business-address"
                            autoComplete="shipping street-address"
                            placeholder="123 Main St, San Francisco, CA 94102"
                            value={answers.businessAddress || ''}
                            onChange={(e) => onUpdate('businessAddress', e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                </CardContent>
            </Card>
            
            {/* Sticky button bar on mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg md:relative md:border-t-0 md:shadow-none md:p-0 md:bg-transparent z-40">
                <div className="max-w-lg mx-auto flex gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onBack}
                        className="px-6"
                    >
                        Back
                    </Button>
                    <Button
                        fullWidth
                        size="lg"
                        onClick={onNext}
                        disabled={!answers.ownerName || !answers.businessAddress || !answers.phone || answers.phone.length < 4}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
