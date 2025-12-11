import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { UserAnswers, ScoreResult, RecommendationResult, DocumentItem, DashboardState } from '../../../types/wellness';
import { calculateScore } from '../../../lib/wellness/scoring';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { calculateLegalHealth, getNextBestAction, NextAction } from '../../../lib/wellness/dashboardLogic';
import { vaultService } from '../../../lib/wellness/vaultService';
import { Card, CardContent } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';
import { Lock, Unlock, Download, Shield, CheckCircle2, Phone, FileText, Search, Globe, Store } from 'lucide-react';
import { DraftingModal } from '../../../components/wellness/DraftingModal';
import { CalendlyModal } from '../../../components/wellness/CalendlyModal';
import { ContractReviewModal } from '../../../components/wellness/ContractReviewModal';
import { OnboardingStepsTracker } from '../../../components/wellness/OnboardingStepsTracker';
import { WebsiteScanModal } from '../../../components/wellness/WebsiteScanModal';
import { LegalHealthProgress } from '../../../components/wellness/dashboard/LegalHealthProgress';
import { NextActionWidget } from '../../../components/wellness/dashboard/NextActionWidget';
import { WelcomeWizard } from '../../../components/wellness/WelcomeWizard';


export const DashboardHome: React.FC = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<UserAnswers | null>(null);
    const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
    const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

    // Modal States
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
    const [isContractReviewModalOpen, setIsContractReviewModalOpen] = useState(false);
    const [isWebsiteScanModalOpen, setIsWebsiteScanModalOpen] = useState(false);
    const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

    const [scanResults, setScanResults] = useState<any>(null);
    const [hasScannedWebsite, setHasScannedWebsite] = useState(false);
    const [hasCompletedContractReview, setHasCompletedContractReview] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Load dashboard data
    useEffect(() => {
        const loadData = async () => {
            let parsedAnswers: UserAnswers | null = null;
            const saved = localStorage.getItem('wellness_onboarding_answers');

            if (saved) {
                parsedAnswers = JSON.parse(saved);
            } else {
                // Try loading from Supabase if not in local storage
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabase
                            .from('business_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .single();

                        if (profile) {
                            // Reconstruct partial answers from profile
                            parsedAnswers = {
                                businessName: profile.business_name,
                                website: profile.website_url,
                                instagram: profile.instagram,
                                businessType: profile.business_type,
                                staffCount: profile.team_size,
                                clientCount: profile.monthly_clients,
                                usesPhotos: profile.uses_photos,
                                primaryConcern: profile.primary_concern,
                                // Default these since they aren't in this table yet
                                // We assume if they have a profile, they are 'safe' to enter
                                email: user.email || '',
                                isProfileComplete: true,
                                // Infer basics
                                hasPhysicalMovement: ['Yoga Studio', 'Pilates Studio', 'Gym / Fitness Studio', 'Personal Trainer'].includes(profile.business_type),
                                services: [], // Will default to empty
                                collectsOnline: true, // Default
                                hiresStaff: profile.team_size !== '0',
                                isOffsiteOrInternational: ['Retreat Leader'].includes(profile.business_type),
                                hostsRetreats: ['Retreat Leader'].includes(profile.business_type),
                            };
                            // Save back to local storage for speed next time
                            localStorage.setItem('wellness_onboarding_answers', JSON.stringify(parsedAnswers));
                        }
                    }
                } catch (e) {
                    console.error('Error loading backup profile:', e);
                }
            }

            if (!parsedAnswers) {
                // FALLBACK: User is properly logged in but has no profile data.
                // Instead of blocking them with a redirect, we provide default "Starter" data.
                console.log('⚠️ No profile found - initializing with defaults to allow Dashboard access');

                parsedAnswers = {
                    email: '',
                    businessName: 'My Wellness Business',
                    businessType: 'Yoga Studio', // Default
                    services: [],
                    hasPhysicalMovement: false,
                    collectsOnline: false,
                    hiresStaff: false,
                    isOffsiteOrInternational: false,
                    isProfileComplete: false
                };

                // Optional: Save this default state so we don't query DB every time
                localStorage.setItem('wellness_onboarding_answers', JSON.stringify(parsedAnswers));
            }

            setAnswers(parsedAnswers);

            // Calculate results
            const score = calculateScore(parsedAnswers);
            const recs = getRecommendedDocuments(parsedAnswers);

            setScoreData(score);
            setRecommendations(recs);

            // Load onboarding progress
            const progress = localStorage.getItem('wellness_onboarding_progress');
            if (progress) {
                try {
                    const parsed = JSON.parse(progress);
                    setHasScannedWebsite(parsed.hasScannedWebsite || false);
                    setHasCompletedContractReview(parsed.hasCompletedContractReview || false);
                } catch (e) { console.error(e); }
            }

            // Load scan results
            const savedScan = localStorage.getItem('wellness_website_scan_result');
            if (savedScan) {
                try {
                    const parsedScan = JSON.parse(savedScan);
                    setScanResults(parsedScan);
                    setHasScannedWebsite(true); // Ensure this is true if we have results
                } catch (e) { console.error('Error parsing scan results:', e); }
            }

            // Check if user has seen wizard
            const hasSeenWizard = localStorage.getItem('hasSeenWelcomeWizard');
            if (!hasSeenWizard) {
                // Small delay for better UX on entry
                setTimeout(() => setShowWelcomeWizard(true), 1000);
            }
        };

        loadData();
    }, [navigate]);

    // Compute Dashboard Logic
    const dashboardState: DashboardState | null = useMemo(() => {
        if (!answers || !scoreData || !recommendations) return null;
        return {
            answers,
            score: scoreData,
            recommendations,
            progress: { hasScannedWebsite, hasCompletedContractReview }
        };
    }, [answers, scoreData, recommendations, hasScannedWebsite, hasCompletedContractReview]);

    const legalHealthScore = dashboardState ? calculateLegalHealth(dashboardState) : 0;
    const nextAction = dashboardState ? getNextBestAction(dashboardState) : null;

    // Handlers
    const handleDraftClick = (doc: DocumentItem) => {
        setSelectedDoc(doc);
        setIsModalOpen(true);
    };

    const handleActionClick = (action: NextAction) => {
        switch (action.actionType) {
            case 'profile': navigate('/wellness/dashboard/profile'); break;
            case 'scan': setIsWebsiteScanModalOpen(true); break;
            case 'review': setIsContractReviewModalOpen(true); break;
            case 'draft':
                if (action.targetId) {
                    const doc = recommendations?.topPriorities.find(d => d.id === action.targetId);
                    if (doc) handleDraftClick(doc);
                }
                break;
            case 'call': setIsCalendlyModalOpen(true); break;
        }
    };

    const handleDownloadPDF = (doc: DocumentItem) => {
        if (doc.pdfPath) {
            const fileName = doc.pdfPath.split('/').pop();
            const link = document.createElement('a');
            link.href = `/pdfs/${fileName}`;
            link.download = fileName || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    const handleGenerateDocument = async (doc: DocumentItem) => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Please log in to generate personalized documents.');
                return;
            }

            // Get template name from PDF path (e.g., "social_media_disclaimer" from "/pdfs/social_media_disclaimer.pdf")
            const pdfFileName = doc.pdfPath?.split('/').pop()?.replace('.pdf', '');

            if (!pdfFileName) {
                console.error('No PDF filename found for document');
                return;
            }

            console.log('[Generate] Generating document:', pdfFileName);

            // Call backend API to generate personalized document
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
            const response = await fetch(`${serverUrl}/api/documents/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    templateName: pdfFileName,
                    userId: user.id,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to generate document: ${response.statusText}`);
            }

            // Download the generated PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const downloadFileName = `${pdfFileName}-personalized-${Date.now()}.pdf`;
            link.href = url;
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log('[Generate] Document generated successfully');

            // Save copy to Vault
            try {
                console.log('[Vault] Saving copy to vault...');
                const file = new File([blob], downloadFileName, { type: 'application/pdf' });
                await vaultService.uploadDocument(
                    file,
                    'contract',
                    doc.title + ' (Personalized)',
                    'Auto-generated personalized document'
                );
                console.log('[Vault] Document saved successfully');
                alert('Document generated and saved to your Vault!');
            } catch (vaultError) {
                console.error('[Vault] Error saving to vault:', vaultError);
                // Don't block the user flow if vault save fails, just log it
            }
        } catch (error: any) {
            console.error('[Generate] Error generating document:', error);
            alert(`Failed to generate document: ${error.message}`);
        }
    };

    if (!answers || !scoreData || !recommendations) {
        return <div className="p-8 text-center text-slate-400">Loading overview...</div>;
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'High': return 'text-red-600 bg-red-50 border-red-100';
            case 'Moderate': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        }
    };

    return (
        <div className="space-y-8">
            {/* Modals */}
            {selectedDoc && (
                <DraftingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    documentItem={selectedDoc}
                    userAnswers={answers}
                />
            )}
            <CalendlyModal isOpen={isCalendlyModalOpen} onClose={() => setIsCalendlyModalOpen(false)} />
            <ContractReviewModal isOpen={isContractReviewModalOpen} onClose={() => setIsContractReviewModalOpen(false)} onComplete={() => setHasCompletedContractReview(true)} />
            <WebsiteScanModal
                isOpen={isWebsiteScanModalOpen}
                onClose={() => setIsWebsiteScanModalOpen(false)}
                onComplete={() => {
                    setIsWebsiteScanModalOpen(false);
                    setHasScannedWebsite(true);
                    // Reload scan results after completion
                    const savedScan = localStorage.getItem('wellness_website_scan_result');
                    if (savedScan) {
                        try {
                            setScanResults(JSON.parse(savedScan));
                        } catch (e) { }
                    }
                }}
                initialWebsite={answers.website}
                initialResults={scanResults}
            />

            {/* Welcome Wizard */}
            <WelcomeWizard
                isOpen={showWelcomeWizard}
                onClose={() => {
                    setShowWelcomeWizard(false);
                    localStorage.setItem('hasSeenWelcomeWizard', 'true');
                }}
                onQuickWin={() => {
                    setShowWelcomeWizard(false);
                    localStorage.setItem('hasSeenWelcomeWizard', 'true');
                    // Find Social Media Disclaimer (usually first free template or specific ID)
                    const quickWinDoc = recommendations?.freeTemplates.find(d => d.title.includes('Social Media')) || recommendations?.freeTemplates[0];
                    if (quickWinDoc) {
                        handleDraftClick(quickWinDoc);
                    }
                }}
                userName={answers.businessName ? answers.businessName.split(' ')[0] : undefined}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
                    <p className="text-slate-600">Your legal roadmap and current status.</p>
                </div>
                <div className="hidden md:block bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <LegalHealthProgress score={legalHealthScore} />
                </div>
            </div>

            {/* Next Best Action */}
            {nextAction && (
                <NextActionWidget action={nextAction} onActionClick={handleActionClick} />
            )}

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">
                    <OnboardingStepsTracker
                        answers={answers}
                        onCompleteProfile={() => navigate('/wellness/dashboard/profile')}
                        onScanWebsite={() => setIsWebsiteScanModalOpen(true)}
                        onReviewDocuments={() => setIsContractReviewModalOpen(true)}
                        onDraftDocument={(docId) => {
                            const doc = recommendations.topPriorities.find(d => d.id === docId) ||
                                recommendations.freeTemplates.find(d => d.id === docId);
                            if (doc) handleDraftClick(doc);
                        }}
                        hasCompletedContractReview={hasCompletedContractReview}
                        hasScannedWebsite={hasScannedWebsite}
                        hasScanResults={!!scanResults}
                        priorityDocumentId={recommendations?.topPriorities[0]?.id}
                    />

                    {/* Unified Document List */}
                    <Card className="border-none shadow-md bg-white overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="text-brand-600" size={24} />
                                    All the Legal Documents Your Business Needs
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Based on your business profile, these are the exact agreements, waivers, and policies recommended for your protection.
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {/* Combine lists: Free templates first, then Advanced */}
                            {[...recommendations.freeTemplates, ...recommendations.advancedTemplates].map((doc) => {
                                const isFree = doc.category === 'free'; // Assuming 'free' is the category for unlocked docs
                                const isLocked = !isFree;

                                return (
                                    <div key={doc.id} className={`p-4 hover:bg-slate-50 transition-colors group ${isLocked ? 'opacity-90' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            {/* Left: Icon & Text */}
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1
                                                    ${isFree ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}
                                                `}>
                                                    {isFree ? <Unlock size={20} /> : <Lock size={20} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`font-semibold text-slate-900 ${isLocked ? 'text-slate-700' : ''}`}>
                                                            {doc.title}
                                                        </h3>
                                                        {isFree && (
                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                                                                Ready
                                                            </span>
                                                        )}
                                                        {isLocked && (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                                                <Lock size={10} /> Lawyer Review
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
                                                        {doc.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
                                                {isFree ? (
                                                    // Unlocked Actions
                                                    <>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            {['template-6', 'template-4', 'template-intake'].includes(doc.id) && (
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => handleGenerateDocument(doc)}
                                                                    className="bg-brand-600 hover:bg-brand-700 text-white flex-1 sm:flex-none whitespace-nowrap"
                                                                >
                                                                    Generate Personalized
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDownloadPDF(doc)}
                                                                className="flex-1 sm:flex-none whitespace-nowrap"
                                                            >
                                                                <Download size={14} className="mr-2" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Locked Actions
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsCalendlyModalOpen(true)}
                                                        className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 w-full sm:w-auto"
                                                    >
                                                        <Phone size={14} className="mr-2" />
                                                        Schedule Review
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Risk Score */}
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <div className={`p-6 flex flex-col items-center ${getRiskColor(scoreData.riskLevel)} rounded-t-lg`}>
                            <span className="text-xs font-bold tracking-wider uppercase mb-3 opacity-80">Risk Score</span>
                            <div className="relative mb-4">
                                <div className="text-3xl font-bold">{scoreData.score}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/50 border border-current`}>
                                {scoreData.riskLevel === 'Low' ? 'LOW EXPOSURE' : scoreData.riskLevel.toUpperCase()}
                            </span>
                        </div>
                    </Card>



                    {/* Need a Pro Card */}
                    <Card className="bg-slate-900 text-white border-none">
                        <CardContent className="p-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Need a Pro?</h3>
                            <Button
                                onClick={() => setIsCalendlyModalOpen(true)}
                                className="w-full bg-brand-600 mt-2"
                            >
                                <Phone className="mr-2 h-4 w-4" />
                                Book Free Call
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
