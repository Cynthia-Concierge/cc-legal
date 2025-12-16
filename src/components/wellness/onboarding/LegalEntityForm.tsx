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
        <div className="w-full max-w-lg mx-auto flex flex-col min-h-[calc(100vh-100px)] md:min-h-0">
            <Card className="w-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col md:flex-none">
                <CardHeader>
                    <CardTitle className="text-xl md:text-2xl text-slate-900 text-center font-bold leading-relaxed">
                        Let's Customize These for Your Business
                    </CardTitle>
                    <p className="text-center text-sm text-slate-600 mt-2">
                        To generate documents that actually protect your exact setup, we just need a few more details.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 pb-24 md:pb-6">

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
                        onClick={handleNext}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
