import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight, Globe, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UserAnswers } from '../../../types/wellness';
import { vaultService } from '../../../lib/wellness/vaultService';
import { supabase } from '../../../lib/supabase';

interface WebsiteInputFormProps {
    answers: UserAnswers;
    onUpdate: (field: keyof UserAnswers, value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const WebsiteInputForm: React.FC<WebsiteInputFormProps> = ({
    answers,
    onUpdate,
    onNext,
    onBack
}) => {
    const [websiteInput, setWebsiteInput] = useState(answers.website || '');
    const [isValid, setIsValid] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [scanResults, setScanResults] = useState<any>(null);
    const [scanMessage, setScanMessage] = useState("Initializing scan...");

    const SCAN_STEPS = [
        "Connecting to website...",
        "Scanning homepage structure...",
        "Searching for legal footers...",
        "Analyzing Privacy Policy...",
        "Reviewing Terms of Service...",
        "Checking for Cookie Consent...",
        "Verifying disclaimer requirements...",
        "Generating compliance report..."
    ];

    const formatWebsiteUrl = (url: string) => {
        let formatted = url.trim();
        if (formatted && !formatted.startsWith('http://') && !formatted.startsWith('https://')) {
            return `https://${formatted}`;
        }
        return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWebsiteInput(e.target.value);
        setIsValid(true);
        setScanComplete(false);
        setScanError(null);
        setScanResults(null);
        setProgress(0);
    };

    const performScan = async (url: string) => {
        setIsScanning(true);
        setScanError(null);
        setProgress(10); // Start progress

        // Simulate progress while waiting for API
        // Simulate progress with specific steps
        let stepIndex = 0;
        setScanMessage(SCAN_STEPS[0]);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                // Cap at 90% until done
                if (prev >= 90) return prev;
                return prev + (90 / SCAN_STEPS.length);
            });

            stepIndex++;
            if (stepIndex < SCAN_STEPS.length) {
                setScanMessage(SCAN_STEPS[stepIndex]);
            }
        }, 800); // cycle through steps every 800ms

        try {
            const response = await fetch('/api/scan-website-compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websiteUrl: url }),
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to scan website');
            }

            const data = await response.json();

            if (data.analysis) {
                const result = {
                    foundDocuments: data.analysis.foundDocuments || [],
                    missingDocuments: data.analysis.missingDocuments || [],
                    issues: data.analysis.issues || [],
                    summary: data.analysis.summary || 'Website scan completed.',
                    websiteUrl: url,
                    timestamp: new Date().toISOString()
                };
                setScanResults(result); // Store local results for display

                localStorage.setItem('wellness_website_scan_result', JSON.stringify(result));

                if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('business_profiles')
                            .update({ has_scanned_website: true, website_scan_completed_at: new Date().toISOString() })
                            .eq('user_id', user.id);
                    }
                }

                try {
                    const reportContent = `WEBSITE COMPLIANCE REPORT\nDate: ${new Date().toLocaleDateString()}\nWebsite: ${url}\n\nSUMMARY\n${result.summary}\n\nFOUND DOCUMENTS\n${result.foundDocuments.length > 0 ? result.foundDocuments.map((d: any) => d.name).join('\n') : 'None'}\n\nMISSING DOCUMENTS\n${result.missingDocuments.length > 0 ? result.missingDocuments.join('\n') : 'None'}`;
                    const reportFile = new File([reportContent], `Compliance Report - ${url.replace(/^https?:\/\//, '')}.txt`, { type: 'text/plain' });
                    await vaultService.uploadDocument(reportFile, 'other', `Website Compliance Report`, `AI Analysis for ${url}`, reportContent);
                } catch (e) {
                    console.error("Error saving report to vault", e);
                }
            }

            setScanComplete(true);

        } catch (err: any) {
            console.error('Scan error:', err);
            clearInterval(progressInterval);
            setScanError(err.message || 'Scan failed. Proceeding manually.');
            // Allow proceed manually on error
        } finally {
            setIsScanning(false);
        }
    };

    const handleNext = async () => {
        // If scan is complete, just go next
        if (scanComplete) {
            onUpdate('website', websiteInput);
            onNext();
            return;
        }

        const formatted = formatWebsiteUrl(websiteInput);

        if (!formatted || formatted === 'https://') {
            onUpdate('website', '');
            onNext();
            return;
        }

        if (!formatted.includes('.')) {
            setIsValid(false);
            return;
        }

        await performScan(formatted);
    };

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-slate-900 text-center font-bold leading-relaxed">
                    What is your business website?
                </CardTitle>
                <p className="text-center text-sm text-slate-600 mt-2">
                    We’ll review your site to see which legal documents you already have, what may be missing, and whether everything matches how your business operates.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Website Input */}
                {!scanComplete && (
                    <div className="space-y-1">
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="example.com"
                                value={websiteInput}
                                onChange={handleChange}
                                disabled={isScanning}
                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all disabled:opacity-70 disabled:bg-slate-50"
                            />
                        </div>
                        {!isValid && <p className="text-xs text-red-500">Please enter a valid website</p>}
                        {scanError && <p className="text-xs text-red-500">{scanError}</p>}
                    </div>
                )}

                {isScanning && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-600 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin h-3 w-3" /> {scanMessage} <span className="opacity-50">({Math.round(progress)}%)</span>
                        </p>
                    </div>
                )}

                {scanComplete && scanResults && (
                    <div className="space-y-4 animate-in zoom-in duration-300">
                        {/* Header */}
                        <div className="flex items-center gap-2 text-brand-700 bg-brand-50 p-3 rounded-lg border border-brand-100">
                            <CheckCircle2 size={20} />
                            <span className="font-semibold text-sm">Scan Complete for {websiteInput}</span>
                        </div>

                        {/* Found Docs */}
                        {scanResults.foundDocuments.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Documents Found</h4>
                                <div className="space-y-2">
                                    {scanResults.foundDocuments.map((doc: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            {doc.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Missing Docs */}
                        {scanResults.missingDocuments.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Missing Documents</h4>
                                <div className="space-y-2">
                                    {scanResults.missingDocuments.map((doc: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-red-50 p-2 rounded border border-red-100">
                                            <AlertTriangle size={16} className="text-red-500" />
                                            {doc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Issues Overview - keeping simple for onboarding */}
                        {scanResults.issues.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Compliance Issues</h4>
                                <p className="text-sm text-slate-600 bg-orange-50 p-3 rounded border border-orange-100">
                                    We found <span className="font-bold text-orange-700">{scanResults.issues.length} potential issues</span>. You can review the full report in your dashboard.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-2 flex gap-3">
                    {!scanComplete && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onBack}
                            disabled={isScanning}
                            className="px-6"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleNext}
                        disabled={isScanning}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        {isScanning ? 'Scanning...' : (scanComplete ? 'View My Plan' : (websiteInput ? '👉 Review Website' : 'Skip & Continue'))}
                        {scanComplete ? <ArrowRight className="ml-2 h-4 w-4" /> : (!isScanning && <ArrowRight className="ml-2 h-4 w-4" />)}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
