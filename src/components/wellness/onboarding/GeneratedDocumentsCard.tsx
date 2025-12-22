import React, { useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, FileText, ArrowRight } from 'lucide-react';
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
    // Calculate counts - ALL documents are now free and customizable
    const stats = useMemo(() => {
        const { freeTemplates } = getRecommendedDocuments(answers);
        const total = freeTemplates.length;

        return { total, freeTemplates };
    }, [answers]);

    // Trigger email sending on mount
    const hasSentRef = useRef(false);

    useEffect(() => {
        const sendDocuments = async () => {
            if (hasSentRef.current) return;
            
            // Check localStorage to avoid duplicate sends across reloads
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

                // CRITICAL: Wait for business profile to exist before sending email
                // The backend endpoint requires a business_profiles record
                const waitForProfile = async (maxRetries = 10, delayMs = 500): Promise<boolean> => {
                    for (let i = 0; i < maxRetries; i++) {
                        try {
                            const { data: profile, error } = await supabase
                                .from('business_profiles')
                                .select('id')
                                .eq('user_id', user.id)
                                .maybeSingle(); // Use maybeSingle() to avoid throwing on not found

                            if (profile && !error) {
                                console.log('✅ Business profile found, proceeding with email...');
                                return true;
                            }

                            // If we get a specific error (not just "not found"), log it
                            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                                console.warn(`⚠️ Error checking for profile:`, error);
                            }
                        } catch (err) {
                            console.warn(`⚠️ Exception checking for profile:`, err);
                        }

                        if (i < maxRetries - 1) {
                            console.log(`⏳ Waiting for business profile... (attempt ${i + 1}/${maxRetries})`);
                            await new Promise(resolve => setTimeout(resolve, delayMs));
                        }
                    }
                    console.error('❌ Business profile not found after retries. Email will not be sent.');
                    return false;
                };

                const profileExists = await waitForProfile();
                if (!profileExists) {
                    console.error('Cannot send onboarding package: business profile does not exist');
                    // Don't mark as sent so it can retry later
                    return;
                }

                // Mark as attempting to send
                hasSentRef.current = true;

                console.log('📧 Triggering onboarding document package email...');
                console.log('📧 User ID:', user.id);
                console.log('📧 Server URL:', import.meta.env.VITE_SERVER_URL || '');
                
                const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                const apiUrl = `${serverUrl}/api/documents/onboarding-package`;
                
                console.log('📧 API Endpoint:', apiUrl);

                // Fire and forget - don't block UI
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });

                console.log('📧 API Response Status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Onboarding package email request sent successfully.', result);
                    sessionStorage.setItem('wellness_onboarding_package_sent', 'true');
                } else {
                    const errorText = await response.text();
                    console.error('❌ FAILED to send onboarding package email');
                    console.error('❌ Status:', response.status);
                    console.error('❌ Error Response:', errorText);
                    
                    // If it's a 404, the profile doesn't exist - this is the main issue
                    if (response.status === 404) {
                        console.error('❌ CRITICAL: Business profile not found in database. Email service was never called.');
                        console.error('❌ This means Resend will show NO attempt because the email service is never invoked.');
                    }
                    
                    // Reset flag so it can retry
                    hasSentRef.current = false;
                }

            } catch (err) {
                console.error('❌ Failed to send onboarding package:', err);
                // Reset flag so it can retry
                hasSentRef.current = false;
            }
        };

        // Small delay to ensure profile creation from previous step has time to complete
        const timeoutId = setTimeout(sendDocuments, 500);
        return () => clearTimeout(timeoutId);
    }, []);

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
                                These {stats.total} documents have been emailed to you.<br />
                                You can customize and download them from inside the dashboard.
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
