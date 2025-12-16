import React, { useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, FileText, ArrowRight, ShieldAlert } from 'lucide-react';
import { UserAnswers } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';

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
    // Calculate counts
    const stats = useMemo(() => {
        const { advancedTemplates, freeTemplates } = getRecommendedDocuments(answers);
        // Add +1 for Insurance Certificates to match ReviewProgressCard and Dashboard
        const total = advancedTemplates.length + freeTemplates.length + 1;
        const freeCount = freeTemplates.length;
        const advancedCount = advancedTemplates.length + 1;

        return { total, freeCount, advancedCount, freeTemplates };
    }, [answers]);

    // Trigger email sending on mount
    const hasSentRef = useRef(false);

    useEffect(() => {
        const sendDocuments = async () => {
            if (hasSentRef.current) return;
            hasSentRef.current = true; // Mark as sent immediately

            // Check localStorage to avoid duplicate sends across reloads if desired, 
            // but user said "resend right now", so maybe we should allow it if they reload?
            // Safer to use session storage or just rely on the Ref for this mount.
            // But let's use a flag to be nice.
            const hasSentStorage = sessionStorage.getItem('wellness_onboarding_package_sent');
            if (hasSentStorage) {
                console.log('Documents already sent this session');
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('No user logged in, cannot send documents yet.');
                    return;
                }

                console.log('Triggering onboarding document package email...');
                const serverUrl = import.meta.env.VITE_SERVER_URL || '';

                // Fire and forget - don't block UI
                fetch(`${serverUrl}/api/documents/onboarding-package`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                }).then(res => {
                    if (res.ok) {
                        console.log('Onboarding package email request sent successfully.');
                        sessionStorage.setItem('wellness_onboarding_package_sent', 'true');
                    } else {
                        console.error('Failed to send onboarding package request:', res.status);
                    }
                }).catch(err => {
                    console.error('Error sending onboarding package:', err);
                });

            } catch (err) {
                console.error('Failed to send onboarding package:', err);
            }
        };

        sendDocuments();
    }, []);

    return (
        <div className="w-full max-w-md mx-auto flex flex-col min-h-[calc(100vh-100px)] md:min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white shadow-xl border-slate-100 overflow-hidden flex-1 flex flex-col md:flex-none">
                <div className="bg-emerald-50 p-6 border-b border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {stats.freeCount} Documents Ready
                    </h2>
                </div>

                <CardContent className="p-8 space-y-8 flex-1 pb-24 md:pb-8">
                    <div className="space-y-6">
                        <p className="text-lg text-slate-600 leading-relaxed text-center">
                            Of your <span className="font-bold text-slate-900">{stats.total} documents</span>, <span className="font-bold text-emerald-600">{stats.freeCount} of them</span> have been fully and perfectly customized for you.
                        </p>

                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
                            <div className="text-xs font-bold uppercase text-emerald-600 mb-1">Ready for Download</div>
                            {stats.freeTemplates.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-700">{doc.title}</span>
                                </div>
                            ))}
                            <div className="pt-2 text-center text-xs text-emerald-700 font-medium">
                                These {stats.freeCount} documents have just been emailed to you.<br />
                                You can also download them from inside the dashboard.
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 flex gap-4">
                            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-amber-900 text-sm">Lawyer Review Required</h3>
                                <p className="text-sm text-amber-800/80 leading-relaxed">
                                    The other <span className="font-bold">{stats.advancedCount} documents</span> need to be lawyer-reviewed to be perfect. It's not something that we can just generate automatically.
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
                        Get Lawyer Review
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
