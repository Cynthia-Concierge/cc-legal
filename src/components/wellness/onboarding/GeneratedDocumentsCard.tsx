import React, { useMemo, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { UserAnswers } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { useToast } from '../../../hooks/use-toast';

interface GeneratedDocumentsCardProps {
    answers: UserAnswers;
    onContinue: () => void;
    onGenerate?: () => void;
    onSkip?: () => void; // New skip prop
}

export const GeneratedDocumentsCard: React.FC<GeneratedDocumentsCardProps> = ({
    answers,
    onContinue,
    onGenerate,
    onSkip
}) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Calculate counts - ALL documents are now free and customizable
    const stats = useMemo(() => {
        const { freeTemplates } = getRecommendedDocuments(answers);
        const total = freeTemplates.length;

        return { total, freeTemplates };
    }, [answers]);

    // Automatically trigger document generation when component mounts
    useEffect(() => {
        const generateDocuments = async () => {
            // Check if already generated (avoid duplicate calls)
            if (generationComplete || isGenerating) {
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.warn('[GeneratedDocumentsCard] No user found, skipping document generation');
                    return;
                }

                setIsGenerating(true);
                setGenerationError(null);

                console.log('[GeneratedDocumentsCard] Triggering document generation for user:', user.id);

                const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                const response = await fetch(`${serverUrl}/api/documents/onboarding-package`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.id,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: response.statusText }));
                    throw new Error(errorData.message || errorData.error || `Failed to generate documents: ${response.status}`);
                }

                const result = await response.json();
                console.log('[GeneratedDocumentsCard] Document generation result:', result);

                setGenerationComplete(true);
                setIsGenerating(false);

                if (onGenerate) {
                    onGenerate();
                }

                toast({
                    title: "Documents Generated!",
                    description: `Successfully generated ${result.generatedCount || stats.total} documents. They're now in your vault.`,
                });

            } catch (error: any) {
                console.error('[GeneratedDocumentsCard] Error generating documents:', error);
                setGenerationError(error.message || 'Failed to generate documents');
                setIsGenerating(false);
                
                toast({
                    variant: "destructive",
                    title: "Document Generation Error",
                    description: error.message || "Some documents may not have been generated. You can try again from your dashboard.",
                });
            }
        };

        // Trigger generation automatically
        generateDocuments();
    }, []); // Only run once on mount


    return (
        <div className="w-full max-w-md mx-auto flex flex-col min-h-[calc(100vh-100px)] md:min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white shadow-xl border-slate-100 overflow-hidden flex-1 flex flex-col md:flex-none">
                <div className="bg-emerald-50 p-6 border-b border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {stats.total} Documents Ready
                    </h2>
                </div>

                <CardContent className="p-8 space-y-8 flex-1 pb-24 md:pb-8">
                    <div className="space-y-6">
                        {isGenerating && (
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex flex-col items-center gap-3">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                <p className="text-sm text-blue-800 font-medium">
                                    Generating your {stats.total} documents...
                                </p>
                                <p className="text-xs text-blue-600">
                                    This may take a minute. Please don't close this page.
                                </p>
                            </div>
                        )}

                        {generationError && (
                            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                                <p className="text-sm text-red-800 font-medium mb-2">
                                    ⚠️ Generation Error
                                </p>
                                <p className="text-xs text-red-600">
                                    {generationError}
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                    Don't worry - you can generate documents from your dashboard.
                                </p>
                            </div>
                        )}

                        {generationComplete && (
                            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                                <p className="text-sm text-emerald-800 font-medium mb-1">
                                    ✅ Documents Generated Successfully!
                                </p>
                                <p className="text-xs text-emerald-600">
                                    All documents have been saved to your vault and are ready to use.
                                </p>
                            </div>
                        )}

                        <p className="text-lg text-slate-600 leading-relaxed text-center">
                            Based on your answers, we've prepared <span className="font-bold text-emerald-600">{stats.total} legal documents</span> fully customized for your business.
                        </p>

                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
                            <div className="text-xs font-bold uppercase text-emerald-600 mb-1">Ready to Customize & Download</div>
                            {stats.freeTemplates.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-700">{doc.title}</span>
                                </div>
                            ))}
                            <div className="pt-2 text-center text-xs text-emerald-700 font-medium">
                                All {stats.total} documents have been generated and saved to your vault.<br />
                                You can access, customize, and download them from your dashboard.
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex gap-4">
                            <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-blue-900 text-sm">100% Customizable</h3>
                                <p className="text-sm text-blue-800/80 leading-relaxed">
                                    All documents are fully editable and can be personalized with your business details directly from the platform.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Sticky button bar on mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg md:relative md:border-t-0 md:shadow-none md:p-0 md:bg-transparent z-40">
                <div className="max-w-md mx-auto space-y-3">
                    <Button
                        fullWidth
                        size="lg"
                        onClick={onContinue}
                        className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200"
                    >
                        Continue to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors"
                        >
                            Skip
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
