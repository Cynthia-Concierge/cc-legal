import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';
import { UserAnswers, EntityType } from '../../../types/wellness';

interface LegalEntityFormProps {
    answers: UserAnswers;
    onUpdate: (field: keyof UserAnswers, value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const LegalEntityForm: React.FC<LegalEntityFormProps> = ({
    answers,
    onUpdate,
    onNext,
    onBack
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const entityTypes: EntityType[] = ['LLC', 'Corporation', 'Sole Proprietorship', 'Partnership'];

    const validate = () => {
        // All fields are optional per user request "(Optional)"
        // So basic navigation is allowed directly.
        return true;
    };

    const handleNext = () => {
        if (validate()) {
            onNext();
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-slate-900 text-center font-bold leading-relaxed">
                    Let’s Customize These for Your Business
                </CardTitle>
                <p className="text-center text-sm text-slate-600 mt-2">
                    To generate documents that actually protect your exact setup, we just need a few more details.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Legal Entity Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Legal Entity Name (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Zen Yoga LLC"
                        value={answers.legalEntityName || ''}
                        onChange={(e) => onUpdate('legalEntityName', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                {/* Entity Type */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Entity Type (Optional)</label>
                    <select
                        value={answers.entityType || ''}
                        onChange={(e) => onUpdate('entityType', e.target.value as EntityType)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all bg-white"
                    >
                        <option value="">Select type...</option>
                        {entityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Owner Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Owner/Representative Name (Optional)</label>
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
                    <label className="text-sm font-medium text-slate-700">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={answers.phone || ''}
                        onChange={(e) => onUpdate('phone', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                {/* Business Address */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Business Address (Optional)</label>
                    <input
                        type="text"
                        placeholder="123 Main St, San Francisco, CA 94102"
                        value={answers.businessAddress || ''}
                        onChange={(e) => onUpdate('businessAddress', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                {/* State */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">State (Optional)</label>
                    <input
                        type="text"
                        placeholder="California"
                        value={answers.state || ''}
                        onChange={(e) => onUpdate('state', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                <div className="pt-6 flex gap-3">
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
                        onClick={handleNext}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
