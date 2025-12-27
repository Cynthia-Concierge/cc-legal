import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { X, ShieldAlert, CheckCircle2, Search, Loader2, AlertTriangle, Mail, CheckCircle, Phone, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/sonner';

interface TrademarkQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (score: number, risk: string, quizData?: { answers: number[], answerDetails: any[], usptoResults?: any }) => void;
    businessName?: string;
    onBookCall?: () => void;
}

interface USPTOSearchResult {
    found: boolean;
    totalResults: number;
    trademarks: any[];
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    recommendation: string;
    searchedTerm: string;
}

export const TrademarkQuizModal: React.FC<TrademarkQuizModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    businessName: initialBusinessName = '',
    onBookCall
}) => {
    // Simplified 4-step flow: name-input → uspto-searching → uspto-results → email-capture
    const [step, setStep] = useState<'name-input' | 'uspto-searching' | 'uspto-results' | 'email-capture'>('name-input');
    const [businessName, setBusinessName] = useState(initialBusinessName);
    const [usptoResults, setUsptoResults] = useState<USPTOSearchResult | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [emailSubmitting, setEmailSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Reset modal to initial state when it opens
    React.useEffect(() => {
        if (isOpen) {
            console.log('[TrademarkModal] Modal opened - resetting to initial state');
            setStep('name-input');
            setBusinessName(initialBusinessName);
            setUsptoResults(null);
            setUserEmail('');
            setUserName('');
            setEmailSubmitting(false);
        }
    }, [isOpen, initialBusinessName]);

    React.useEffect(() => {
        // Pre-fill email from localStorage if available
        const storedAnswers = localStorage.getItem('wellness_onboarding_answers');
        if (storedAnswers) {
            try {
                const parsed = JSON.parse(storedAnswers);
                if (parsed.email) setUserEmail(parsed.email);
            } catch (e) {
                // Ignore parsing errors
            }
        }

        // Pre-fill email from current user session
        const loadUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        loadUserEmail();
    }, []);

    if (!isOpen) return null;

    const handleNameSubmit = async () => {
        if (!businessName.trim()) {
            toast.error('Please enter your business name');
            return;
        }

        setStep('uspto-searching');

        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
            const response = await fetch(`${serverUrl}/api/trademarks/uspto-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ businessName: businessName.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to search USPTO database');
            }

            const data = await response.json();
            setUsptoResults(data);
            setStep('uspto-results');
        } catch (error) {
            console.error('USPTO search error:', error);
            toast.error('Failed to search trademark database. Please try again.');
            setStep('name-input');
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);

        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';

            const response = await fetch(`${serverUrl}/api/trademarks/download-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessName: businessName.trim(),
                    usptoResults: usptoResults
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate trademark report');
            }

            // Get PDF blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Trademark-Risk-Report-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log('[TrademarkModal] Report downloaded successfully');
            toast.success('Report downloaded successfully!');

            // Show success state
            setStep('email-capture');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleEmailSubmit = async () => {
        setEmailSubmitting(true);

        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
            const { data: { user } } = await supabase.auth.getUser();

            // Use user's profile email if available, otherwise require input
            const emailToUse = user?.email || userEmail.trim();

            if (!emailToUse) {
                toast.error('Please enter your email address');
                setEmailSubmitting(false);
                return;
            }

            const response = await fetch(`${serverUrl}/api/trademarks/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    businessName: businessName.trim(),
                    email: emailToUse,
                    name: userName.trim() || emailToUse.split('@')[0],
                    usptoResults: usptoResults
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send trademark report');
            }

            const data = await response.json();
            console.log('[TrademarkModal] Report sent successfully:', data);

            toast.success('Report sent! Check your email');
        } catch (error) {
            console.error('Email submission error:', error);
            toast.error('Failed to send report. Please try again.');
        } finally {
            setEmailSubmitting(false);
        }
    };

    const getRiskColor = (risk: string) => {
        if (risk === 'HIGH') return 'text-red-600 bg-red-50 border-red-200';
        if (risk === 'MODERATE') return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    };

    const getRiskIcon = (risk: string) => {
        if (risk === 'HIGH') return <AlertTriangle className="w-10 h-10" />;
        if (risk === 'MODERATE') return <ShieldAlert className="w-10 h-10" />;
        return <CheckCircle2 className="w-10 h-10" />;
    };

    const getUrgencyMessage = (risk: string, totalConflicts: number) => {
        if (risk === 'HIGH') {
            return {
                headline: "HIGH RISK: Immediate Action Recommended",
                description: `We found ${totalConflicts} registered trademark(s) that could conflict with "${businessName}". Using this name could lead to legal challenges and force you to rebrand.`,
                cta: "Get your detailed report to understand next steps"
            };
        } else if (risk === 'MODERATE') {
            return {
                headline: "MODERATE RISK: Protection Recommended",
                description: `Our USPTO search found ${totalConflicts} similar trademark(s). While not exact matches, these similarities could create marketplace confusion as you grow.`,
                cta: "Get your report to see conflict details and protection options"
            };
        } else {
            return {
                headline: "GOOD NEWS: Low Conflict Risk",
                description: `No exact matches found in the USPTO database for "${businessName}". However, protection is still recommended before investing heavily in branding.`,
                cta: "Get your report to ensure long-term protection"
            };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                {/* Step 1: Business Name Input */}
                {step === 'name-input' && (
                    <>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-bold">Free Trademark Risk Scan</CardTitle>
                                    <p className="text-slate-500 mt-1">Instant results • No credit card • 100% free</p>
                                </div>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        What's your business name?
                                    </label>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                        placeholder="e.g., Serenity Yoga Studio"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-lg"
                                        autoFocus
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Search className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-2">What we'll check:</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>✓ Exact matches in USPTO database (2.8M+ trademarks)</li>
                                                <li>✓ Similar registered trademarks in your industry</li>
                                                <li>✓ Potential conflicts and risk assessment</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleNameSubmit}
                                    className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white py-3 text-lg"
                                    disabled={!businessName.trim()}
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Get My Free Trademark Report
                                </Button>

                                <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Instant results
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" /> No credit card
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Step 2: USPTO Searching */}
                {step === 'uspto-searching' && (
                    <>
                        <CardHeader className="border-b">
                            <CardTitle>Searching USPTO Database...</CardTitle>
                        </CardHeader>
                        <CardContent className="p-12">
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-700">Searching for "{businessName}"</p>
                                    <p className="text-sm text-slate-500 mt-2">Scanning 2.8 million trademarks...</p>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Step 3: USPTO Results with Email Capture */}
                {step === 'uspto-results' && usptoResults && (
                    <>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Trademark Risk Assessment</CardTitle>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Risk Level Badge - Large and Prominent */}
                                <div className={`rounded-xl p-6 border-2 ${getRiskColor(usptoResults.riskLevel)}`}>
                                    <div className="flex flex-col items-center text-center gap-3">
                                        {getRiskIcon(usptoResults.riskLevel)}
                                        <div>
                                            <h3 className="text-2xl font-bold">{usptoResults.riskLevel} RISK</h3>
                                            <p className="text-lg font-semibold mt-1">{usptoResults.totalResults} similar trademark(s) found</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Urgency Messaging */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                                        {getUrgencyMessage(usptoResults.riskLevel, usptoResults.totalResults).headline}
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed">
                                        {getUrgencyMessage(usptoResults.riskLevel, usptoResults.totalResults).description}
                                    </p>
                                </div>

                                {/* Top Conflicting Trademarks */}
                                {usptoResults.trademarks && usptoResults.trademarks.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-3">Top Conflicting Trademarks:</h4>
                                        <div className="space-y-2">
                                            {usptoResults.trademarks.slice(0, 5).map((tm, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-900">{tm.markText}</p>
                                                            <p className="text-sm text-slate-500 mt-0.5">Owner: {tm.owner}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ml-2 ${
                                                            tm.liveOrDead === 'LIVE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {tm.liveOrDead}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Download & Email Options */}
                                <div className="border-t pt-6">
                                    <div className="bg-gradient-to-br from-brand-50 to-purple-50 border-2 border-brand-200 rounded-xl p-6">
                                        <div className="text-center mb-5">
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                Get Your Free Detailed Report
                                            </h3>
                                            <p className="text-sm text-slate-600">
                                                {getUrgencyMessage(usptoResults.riskLevel, usptoResults.totalResults).cta}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Primary: Download Button */}
                                            <Button
                                                onClick={handleDownloadPDF}
                                                disabled={downloading}
                                                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white py-3.5 text-lg"
                                            >
                                                {downloading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Downloading Report...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-5 h-5 mr-2" />
                                                        Download Free Report
                                                    </>
                                                )}
                                            </Button>

                                            {/* Divider */}
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-slate-300"></div>
                                                </div>
                                                <div className="relative flex justify-center text-xs">
                                                    <span className="bg-gradient-to-br from-brand-50 to-purple-50 px-2 text-slate-500">or</span>
                                                </div>
                                            </div>

                                            {/* Secondary: Email Button */}
                                            <Button
                                                onClick={handleEmailSubmit}
                                                disabled={emailSubmitting}
                                                variant="outline"
                                                className="w-full border-brand-300 text-brand-700 hover:bg-brand-50 py-2.5"
                                            >
                                                {emailSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="w-5 h-5 mr-2" />
                                                        Email Me a Copy
                                                    </>
                                                )}
                                            </Button>

                                            <p className="text-xs text-center text-slate-500">
                                                We'll use your account email. No spam, ever.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Step 4: Success State with Call Booking CTA */}
                {step === 'email-capture' && (
                    <>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Report Sent!</CardTitle>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Success Animation */}
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
                                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Check Your Inbox!</h3>
                                    <p className="text-slate-600">
                                        We've sent your Trademark Risk Report to <strong>{userEmail}</strong>
                                    </p>
                                </div>

                                {/* Risk Summary */}
                                {usptoResults && (
                                    <div className={`rounded-lg p-4 border ${getRiskColor(usptoResults.riskLevel)}`}>
                                        <div className="text-center">
                                            <p className="font-semibold">Your Risk Level: {usptoResults.riskLevel}</p>
                                            <p className="text-sm mt-1">{usptoResults.totalResults} conflicts found</p>
                                        </div>
                                    </div>
                                )}

                                {/* Call Booking CTA - Prominent */}
                                <div className="bg-gradient-to-br from-purple-50 to-brand-50 border-2 border-purple-200 rounded-xl p-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            Want Deeper Analysis?
                                        </h3>
                                        <p className="text-slate-700 mb-4">
                                            Our trademark attorney will review your specific situation, explain the USPTO results in detail, and recommend personalized protection strategies for {businessName}.
                                        </p>

                                        {onBookCall && (
                                            <Button
                                                onClick={() => {
                                                    onBookCall();
                                                    onClose();
                                                }}
                                                className="w-full bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white py-3 text-lg"
                                            >
                                                <Phone className="w-5 h-5 mr-2" />
                                                Book Your Free Strategy Call
                                            </Button>
                                        )}

                                        <p className="text-sm text-slate-500 mt-3">
                                            30-minute consultation • No obligation • Trademark expert
                                        </p>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Close
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};
