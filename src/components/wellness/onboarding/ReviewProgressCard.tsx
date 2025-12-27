import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserAnswers } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { TEMPLATE_TO_CHECKLIST } from '../vault/LegalInventoryChecklist';

interface ReviewProgressCardProps {
    answers: UserAnswers;
    onContinue: () => void;
}

export const ReviewProgressCard: React.FC<ReviewProgressCardProps> = ({
    answers,
    onContinue
}) => {
    const [categories, setCategories] = useState<{
        id: string;
        label: string;
        count: number;
        found?: number;
        total?: number;
        message?: string;
    }[]>([]);

    const [totalNeeded, setTotalNeeded] = useState(0);

    useEffect(() => {
        // Calculate recommended documents
        const { advancedTemplates, freeTemplates } = getRecommendedDocuments(answers);
        const allDocs = [...advancedTemplates, ...freeTemplates];

        // Group by category
        const counts: Record<string, number> = {
            core: 0,
            website: 0,
            marketing: 0,
            studio: 0,
            retreat: 0,
            employment: 0,
            advanced: 0
        };

        const processedIds = new Set<string>();

        allDocs.forEach(doc => {
            if (processedIds.has(doc.id)) return;
            processedIds.add(doc.id);

            const mapping = TEMPLATE_TO_CHECKLIST[doc.id];
            if (mapping) {
                if (counts[mapping.category] !== undefined) {
                    counts[mapping.category]++;
                }
            } else {
                // Fallback or unmapped?
                // documentEngine might have categories like 'free', 'advanced' which don't match the display categories completely
                // But TEMPLATE_TO_CHECKLIST should cover most IDs.
                // If not found, maybe ignore or put in advanced?
            }
        });


        // Handle Website Scan Results
        let websiteScanData: { found: number; total: number } | null = null;
        try {
            const savedScan = localStorage.getItem('wellness_website_scan_result');
            if (savedScan) {
                const scanResult = JSON.parse(savedScan);
                if (scanResult) {
                    const found = scanResult.foundDocuments?.length || 0;
                    const missing = scanResult.missingDocuments?.length || 0;
                    if (found + missing > 0) {
                        websiteScanData = {
                            found,
                            total: found + missing
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Error reading scan results:', e);
        }

        // Build display categories
        const newCategories = [];
        let totalCount = 0;

        // 1. Website Compliance
        if (websiteScanData) {
            newCategories.push({
                id: 'website',
                label: 'Website Compliance',
                count: websiteScanData.total - websiteScanData.found, // Needed
                found: websiteScanData.found,
                total: websiteScanData.total,
                message: `You have ${websiteScanData.found} of ${websiteScanData.total} documents needed.`
            });
            // Don't add to total needed count for the summary header if we want to match the "14 documents" logic strictly?
            // The "totalNeeded" usually implies *total documents recommended*.
            // If using scan data, total needed is distinct from the template list.
            // Let's use the template list for the "Total Needed" number to be consistent with the Vault.
            // But for the specific "Website" row, use scan data if valid.
        } else if (counts.website > 0) {
            newCategories.push({
                id: 'website',
                label: 'Website Compliance',
                count: counts.website,
                message: `${counts.website} documents needed for website protection.`
            });
        }

        // 2. Core Business
        if (counts.core > 0) {
            newCategories.push({
                id: 'core',
                label: 'Core Business Documents',
                count: counts.core,
                message: `${counts.core} essential documents for your business foundation.`
            });
        }

        // 3. Marketing
        if (counts.marketing > 0) {
            newCategories.push({
                id: 'marketing',
                label: 'Marketing & Media',
                count: counts.marketing,
                message: `${counts.marketing} documents for content and social media.`
            });
        }

        // 4. Studio
        if (counts.studio > 0) {
            newCategories.push({
                id: 'studio',
                label: 'Studio-Specific',
                count: counts.studio,
                message: `${counts.studio} documents for facility management.`
            });
        }

        // 5. Retreat
        if (counts.retreat > 0) {
            newCategories.push({
                id: 'retreat',
                label: 'Retreat-Specific',
                count: counts.retreat,
                message: `${counts.retreat} documents for retreat liability.`
            });
        }

        // 6. Employment
        if (counts.employment > 0) {
            newCategories.push({
                id: 'employment',
                label: 'Employment Agreements',
                count: counts.employment,
                message: `${counts.employment} documents for staff and contractors.`
            });
        }

        // 7. Advanced
        if (counts.advanced > 0) {
            newCategories.push({
                id: 'advanced',
                label: 'Advanced / Situational',
                count: counts.advanced,
                message: `${counts.advanced} additional agreements for specific situations.`
            });
        }

        setCategories(newCategories);

        // Calculate total strictly from recommendations (consistent with Vault)
        let calcTotal = Object.values(counts).reduce((a, b) => a + b, 0);
        setTotalNeeded(calcTotal);

    }, [answers]);

    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white shadow-xl border-slate-100 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
                    <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Assessment Complete
                    </h2>
                </div>

                <CardContent className="p-8 pb-32 md:pb-8 space-y-8">
                    <div className="space-y-6">
                        <p className="text-lg text-slate-600 leading-relaxed text-center">
                            Based on your answers, you need a total of <span className="font-bold text-slate-900">{totalNeeded} documents</span> to be fully protected.
                        </p>

                        <div className="space-y-4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-brand-600 border border-slate-100 flex-shrink-0">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-lg mb-1">
                                                {cat.label}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {cat.found !== undefined ? (
                                                    <>
                                                        You currently have <span className="font-bold text-slate-900">{cat.found}</span> of the <span className="font-bold text-slate-900">{cat.total}</span> documents you need for your website.
                                                    </>
                                                ) : (
                                                    cat.message
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <Button
                            fullWidth
                            size="lg"
                            onClick={onContinue}
                            className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200"
                        >
                            Download my custom documents
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Sticky Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-50">
                <Button
                    fullWidth
                    size="lg"
                    onClick={onContinue}
                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200"
                >
                    Download my custom documents
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};
