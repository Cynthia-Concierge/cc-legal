import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LegalInventoryChecklist } from '../../../components/wellness/vault/LegalInventoryChecklist';
import { supabase } from '../../../lib/supabase';
import { UserAnswers, ScoreResult, RecommendationResult, DocumentItem, DashboardState, UserDocument } from '../../../types/wellness';
import { calculateScore } from '../../../lib/wellness/scoring';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { getCompletedDocumentsCount, getCompletedDocumentsList } from '../../../lib/wellness/documentCountUtils';
import { calculateLegalHealth, getNextBestAction, NextAction } from '../../../lib/wellness/dashboardLogic';
import { vaultService } from '../../../lib/wellness/vaultService';
import { Card, CardContent } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';
import { Lock, Unlock, Shield, CheckCircle2, Phone, FileText, Search, Globe, Store, ChevronDown } from 'lucide-react';
import { DraftingModal } from '../../../components/wellness/DraftingModal';
import { CalendlyModal } from '../../../components/wellness/CalendlyModal';
import { ContractReviewModal } from '../../../components/wellness/ContractReviewModal';
import { OnboardingStepsTracker } from '../../../components/wellness/OnboardingStepsTracker';
import { WebsiteScanModal } from '../../../components/wellness/WebsiteScanModal';
import { TrademarkQuizModal } from '../../../components/wellness/TrademarkQuizModal';
import { LegalHealthProgress } from '../../../components/wellness/dashboard/LegalHealthProgress';
import { NextActionWidget } from '../../../components/wellness/dashboard/NextActionWidget';
import { ProtectionJourney } from '../../../components/wellness/dashboard/ProtectionJourney';
import { IpProtectionWidget } from '../../../components/wellness/dashboard/IpProtectionWidget';
import { toast } from '../../../components/ui/use-toast';

import { SocialProofWidget } from '../../../components/wellness/dashboard/SocialProofWidget';
import { WebsiteComplianceWidget } from '../../../components/wellness/dashboard/WebsiteComplianceWidget';
import { socialProofStats } from '../../../config/socialProofStats';
import { DocumentViewerModal } from '../../../components/wellness/vault/DocumentViewerModal';
import { CopyableDocumentModal } from '../../../components/wellness/vault/CopyableDocumentModal';


export const DashboardHome: React.FC = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<UserAnswers | null>(null);
    const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
    const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
    const [documents, setDocuments] = useState<UserDocument[]>([]);

    // Modal States
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
    const [isContractReviewModalOpen, setIsContractReviewModalOpen] = useState(false);
    const [isWebsiteScanModalOpen, setIsWebsiteScanModalOpen] = useState(false);
    const [isTrademarkModalOpen, setIsTrademarkModalOpen] = useState(false);
    // Removed showWelcomeWizard
    const [isDocListOpen, setIsDocListOpen] = useState(false); // Collapsed by default

    const [scanResults, setScanResults] = useState<any>(null);
    const [trademarkQuizResult, setTrademarkQuizResult] = useState<{ score: number, risk: string } | null>(null);
    const [hasScannedWebsite, setHasScannedWebsite] = useState(false);
    const [hasCompletedContractReview, setHasCompletedContractReview] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Document viewing state
    const [viewerDoc, setViewerDoc] = useState<UserDocument | null>(null);
    const [viewerContent, setViewerContent] = useState<string>('');
    const [copyableDoc, setCopyableDoc] = useState<UserDocument | null>(null);
    const [copyableHtmlContent, setCopyableHtmlContent] = useState<string>('');
    const [isLoadingHtml, setIsLoadingHtml] = useState(false);

    // Ref to scroll to the documents section
    const documentsSectionRef = useRef<HTMLDivElement | null>(null);

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
                                services: profile.services || [], // Load from profile if available
                                collectsOnline: profile.collects_online ?? true, // Default
                                hiresStaff: profile.hires_staff ?? (profile.team_size !== '0'), // Load from profile, fallback to team_size
                                hasEmployees: profile.has_w2_employees ?? false, // CRITICAL: Load W2 employees flag
                                isOffsiteOrInternational: profile.is_offsite_or_international ?? (['Retreat Leader'].includes(profile.business_type)),
                                hostsRetreats: profile.hosts_retreats ?? (['Retreat Leader'].includes(profile.business_type)),
                                offersOnlineCourses: profile.offers_online_courses ?? false,
                                sellsProducts: profile.sells_products ?? false,
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

            // Load trademark quiz results
            const savedTrademark = localStorage.getItem('wellness_trademark_result');
            if (savedTrademark) {
                try {
                    setTrademarkQuizResult(JSON.parse(savedTrademark));
                } catch (e) { }
            }


            // Load user documents
            try {
                const docs = await vaultService.getUserDocuments();
                setDocuments(docs);
            } catch (e) {
                console.error('Error loading documents:', e);
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

    // Document viewing handlers
    const handleViewDocument = async (doc: UserDocument) => {
        try {
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                toast({
                    variant: "destructive",
                    title: "Could not open document",
                    description: "We couldn't generate a secure link for this file. Please try again.",
                });
                return;
            }

            // Check if it's a text file we can display in-app
            const isTextFile = doc.file_type === 'txt' || doc.file_type === 'md' || doc.file_type === 'json' || doc.file_path.endsWith('.txt') || doc.file_path.endsWith('.md');

            if (isTextFile) {
                try {
                    // Fetch the content
                    const response = await fetch(url);
                    if (response.ok) {
                        const text = await response.text();
                        setViewerContent(text);
                        setViewerDoc(doc);
                        return;
                    }
                } catch (fetchErr) {
                    console.error('Failed to fetch text content:', fetchErr);
                    // Fall back to opening in new tab
                }
            }

            // Default: Open in new tab (browser will display PDF/Image)
            window.open(url, '_blank');

        } catch (error) {
            console.error('View failed', error);
            toast({
                variant: "destructive",
                title: "Could not open document",
                description: "An error occurred while trying to open the document.",
            });
        }
    };

    const handleDownloadDocument = async (doc: UserDocument) => {
        try {
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                toast({
                    variant: "destructive",
                    title: "Could not download document",
                    description: "We couldn't generate a secure link for this file. Please try again.",
                });
                return;
            }

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.title || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Download started",
                description: `"${doc.title}" is downloading.`,
            });
        } catch (error) {
            console.error('Download failed', error);
            toast({
                variant: "destructive",
                title: "Download failed",
                description: "An error occurred while trying to download the document.",
            });
        }
    };

    const handleCopyAsText = async (doc: UserDocument) => {
        try {
            setIsLoadingHtml(true);
            setCopyableDoc(doc);

            // Get the download URL for the document
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                toast({
                    variant: "destructive",
                    title: "Could not load document",
                    description: "We couldn't generate a link for this file. Please try again.",
                });
                setIsLoadingHtml(false);
                setCopyableDoc(null);
                return;
            }

            // Check if this is a template-based document that we can generate HTML for
            if (doc.document_type && doc.document_type.startsWith('template-')) {
                try {
                    // Get template name from document_type
                    const templateId = doc.document_type;
                    const TEMPLATE_ID_TO_FILE_NAME: Record<string, string> = {
                        'template-6': 'social_media_disclaimer',
                        'template-4': 'media_release_form',
                        'template-intake': 'client_intake_form',
                        'template-1': 'waiver_release_of_liability',
                        'template-2': 'service_agreement_membership_contract',
                        'template-5': 'testimonial_consent_agreement',
                        'template-7': 'independent_contractor_agreement',
                        'template-8': 'employment_agreement',
                        'template-membership': 'membership_agreement',
                        'template-studio': 'studio_policies',
                        'template-class': 'class_terms_conditions',
                        'template-privacy': 'privacy_policy',
                        'template-website': 'website_terms_conditions',
                        'template-refund': 'refund_cancellation_policy',
                        'template-disclaimer': 'website_disclaimer',
                        'template-cookie': 'cookie_policy',
                        'template-retreat-waiver': 'retreat_liability_waiver',
                        'template-travel': 'travel_excursion_agreement',
                    };

                    const templateName = TEMPLATE_ID_TO_FILE_NAME[templateId];
                    if (templateName && user) {
                        // Call the generate-html endpoint
                        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                        const response = await fetch(`${serverUrl}/api/documents/generate-html`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                templateName: templateName,
                                userId: user.id,
                            }),
                        });

                        if (response.ok) {
                            const html = await response.text();
                            setCopyableHtmlContent(html);
                            setIsLoadingHtml(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Failed to generate HTML:', error);
                }
            }

            // Fallback: try to fetch as text
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    setCopyableHtmlContent(text);
                    setIsLoadingHtml(false);
                    return;
                }
            } catch (fetchErr) {
                console.error('Failed to fetch document content:', fetchErr);
            }

            // If all else fails, show error
            toast({
                variant: "destructive",
                title: "Could not load document",
                description: "This document cannot be copied as text.",
            });
            setIsLoadingHtml(false);
            setCopyableDoc(null);
        } catch (error) {
            console.error('Copy as text failed', error);
            toast({
                variant: "destructive",
                title: "Could not load document",
                description: "An error occurred while trying to load the document.",
            });
            setIsLoadingHtml(false);
            setCopyableDoc(null);
        }
    };

    const handleGenerateDocument = async (doc: DocumentItem) => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    variant: "destructive",
                    title: "Please log in",
                    description: "You need to be logged in to generate personalized documents.",
                });
                return;
            }

            // Check if profile is complete
            if (!answers?.isProfileComplete) {
                toast({
                    title: "Finish your business profile",
                    description: "Add a few details about your business so we can auto‑fill your documents.",
                });
                navigate('/wellness/dashboard/profile');
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
            // Use relative URL by default so it works in both dev (Vite proxy) and prod (Firebase Hosting rewrites)
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
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
                toast({
                    title: "Document ready",
                    description: "Your personalized document was generated and saved to your Vault.",
                });
            } catch (vaultError) {
                console.error('[Vault] Error saving to vault:', vaultError);
                // Don't block the user flow if vault save fails, just log it
            }
        } catch (error: any) {
            console.error('[Generate] Error generating document:', error);
            toast({
                variant: "destructive",
                title: "Failed to generate document",
                description: error?.message || "Something went wrong while generating your document. Please try again.",
            });
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

            <TrademarkQuizModal
                isOpen={isTrademarkModalOpen}
                onClose={() => setIsTrademarkModalOpen(false)}
                onComplete={(score, risk, quizData) => {
                    const result = { score, risk };
                    setTrademarkQuizResult(result);
                    localStorage.setItem('wellness_trademark_result', JSON.stringify(result));
                    // Store quiz data if provided
                    if (quizData) {
                        localStorage.setItem('wellness_trademark_quiz_data', JSON.stringify(quizData));
                    }
                }}
                businessName={answers.businessName}
                onBookCall={() => setIsCalendlyModalOpen(true)}
            />



            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {/* Mobile Greeting */}
                    <h1 className="md:hidden text-2xl font-bold text-slate-900 mb-1">
                        {answers.businessName ? `Hi, ${answers.businessName.split(' ')[0]}` : 'Welcome back'}
                    </h1>
                    <h1 className="hidden md:block text-3xl font-bold text-slate-900">Overview</h1>
                    <p className="text-slate-600">Your legal roadmap and current status.</p>
                </div>
                <div className="hidden md:block bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <LegalHealthProgress score={legalHealthScore} />
                </div>
            </div>

            {/* Mobile Risk Score & Stats */}
            <div className="md:hidden mb-6">
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <div className={`p-6 flex flex-col items-center ${getRiskColor(scoreData.riskLevel)}`}>
                        <span className="text-xs font-bold tracking-wider uppercase mb-3 opacity-80">Risk Score</span>
                        <div className="relative mb-2">
                            <div className="text-4xl font-bold">{scoreData.score}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/50 border border-current mb-4`}>
                            {scoreData.riskLevel === 'Low' ? 'LOW EXPOSURE' : scoreData.riskLevel.toUpperCase()}
                        </span>

                        <div className="text-sm font-medium opacity-90">
                            {/* Calculate missing docs: Total needed - (free + drafted/advanced done?) 
                               For now, let's just show Total Needed vs Total Missing based on simple logic 
                            */}
                            {(() => {
                                if (!recommendations) return null;
                                const { completed, total } = getCompletedDocumentsCount(documents, answers);
                                return (
                                    <div className="flex flex-col items-center gap-3">
                                        <span>
                                            <span className="font-bold">{completed}</span> out of <span className="font-bold">{total}</span> Documents Completed
                                        </span>

                                        {/* List Completed Documents */}
                                        {completed > 0 && (() => {
                                            const completedDocs = getCompletedDocumentsList(documents, answers);
                                            return (
                                                <div className="flex flex-col gap-1.5 w-full max-w-[240px]">
                                                    {completedDocs.slice(0, 3).map((doc, index) => (
                                                        <div key={`${doc.label}-${index}`} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100">
                                                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                            <span className="truncate font-medium">{doc.label}</span>
                                                        </div>
                                                    ))}
                                                    {completed > 3 && (
                                                        <div className="text-[10px] text-slate-500 text-center">
                                                            +{completed - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <Button
                                            variant="ghost"
                                            className="text-xs text-slate-500 underline opacity-90 hover:opacity-100 hover:bg-transparent h-auto p-0 whitespace-normal text-center max-w-[200px] mt-1"
                                            onClick={() => navigate('/wellness/dashboard/documents')}
                                        >
                                            Upload your documents now for review and analysis
                                        </Button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Next Best Action - Mobile Hero */}
            {/* {nextAction && (
                <div className="animate-in slide-in-from-bottom-4 duration-700">
                    <NextActionWidget action={nextAction} onActionClick={handleActionClick} />
                </div>
            )} */}

            {/* <div className="hidden md:block">
                <SocialProofWidget
                    stats={socialProofStats}
                    animated={true}
                    autoRefresh={true}
                    refreshInterval={5 * 60 * 1000} // 5 minutes
                />
            </div> */}

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">


                    {/* <div className="hidden md:block">
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
                    </div> */}

                    {/* Protection Journey / Levels */}
                    {/* <ProtectionJourney
                        answers={answers}
                        recommendations={recommendations}
                        hasScannedWebsite={hasScannedWebsite}
                        hasCompletedContractReview={hasCompletedContractReview}
                        onBookCall={() => setIsCalendlyModalOpen(true)}
                        onGoToProfile={() => navigate('/wellness/dashboard/profile')}
                        onOpenDocuments={() => {
                            if (documentsSectionRef.current) {
                                documentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        onScanWebsite={() => setIsWebsiteScanModalOpen(true)}
                        onReviewContracts={() => setIsContractReviewModalOpen(true)}
                    /> */}

                    {/* Unified Document List */}
                    <div ref={documentsSectionRef} className="scroll-mt-6">
                        <Card className="border-none shadow-md bg-white overflow-hidden transition-all duration-300">
                            <div
                                className="p-4 border-b border-slate-100 flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setIsDocListOpen(!isDocListOpen)}
                            >
                                <div className="flex-1 pr-4">
                                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">1</div>
                                        Your Required Legal Documents
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 pl-7">
                                        Here are all the agreements, waivers, and policies your business needs — including what you already have and what may be missing.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                        {(() => {
                                            const { completed, total } = getCompletedDocumentsCount(documents, answers);
                                            return `${completed} / ${total} Docs`;
                                        })()}
                                    </span>
                                    <ChevronDown
                                        className={`text-slate-400 transition-transform duration-300 ${isDocListOpen ? 'rotate-180' : ''}`}
                                        size={18}
                                    />
                                </div>
                            </div>

                            {isDocListOpen && (
                                <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                                    <LegalInventoryChecklist
                                        documents={documents}
                                        userAnswers={answers}
                                        onUploadClick={() => navigate('/wellness/dashboard/documents')}
                                        onUploadWithType={(type, label) => navigate('/wellness/dashboard/documents')}
                                        onViewDocument={handleViewDocument}
                                        onDownloadDocument={handleDownloadDocument}
                                        onCopyAsText={handleCopyAsText}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>
                    {/* Website Compliance - Collapsible */}
                    <div className="mt-6">
                        <WebsiteComplianceWidget
                            hasScannedWebsite={hasScannedWebsite}
                            scanResults={scanResults}
                            onOpenScanModal={() => setIsWebsiteScanModalOpen(true)}
                        />
                    </div>

                    {/* IP Protection - Collapsible */}
                    <div className="mt-6">
                        <IpProtectionWidget
                            onStartQuiz={() => setIsTrademarkModalOpen(true)}
                            hasTakenQuiz={!!trademarkQuizResult}
                            score={trademarkQuizResult?.score}
                            riskLevel={trademarkQuizResult?.risk}
                            onBookCall={() => setIsCalendlyModalOpen(true)}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Risk Score - Desktop */}
                    <Card className="hidden lg:block border-none shadow-md overflow-hidden bg-white">
                        <div className={`p-6 flex flex-col items-center ${getRiskColor(scoreData.riskLevel)} rounded-t-lg`}>
                            <span className="text-xs font-bold tracking-wider uppercase mb-3 opacity-80">Risk Score</span>
                            <div className="relative mb-4">
                                <div className="text-3xl font-bold">{scoreData.score}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/50 border border-current mb-4`}>
                                {scoreData.riskLevel === 'Low' ? 'LOW EXPOSURE' : scoreData.riskLevel.toUpperCase()}
                            </span>

                            <div className="text-sm font-medium opacity-90 text-center">
                                {(() => {
                                    if (!recommendations) return null;
                                    const { completed, total } = getCompletedDocumentsCount(documents, answers);
                                    return (
                                        <div className="flex flex-col items-center gap-3">
                                            <span>
                                                <span className="font-bold">{completed}</span> out of <span className="font-bold">{total}</span> Documents Completed
                                            </span>

                                            {/* List Completed Documents */}
                                            {completed > 0 && (() => {
                                                const completedDocs = getCompletedDocumentsList(documents, answers);
                                                return (
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        {completedDocs.slice(0, 3).map((doc, index) => (
                                                            <div key={`${doc.label}-${index}`} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100 text-left">
                                                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                                <span className="truncate font-medium">{doc.label}</span>
                                                            </div>
                                                        ))}
                                                        {completed > 3 && (
                                                            <div className="text-[10px] text-slate-500 text-center">
                                                                +{completed - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <Button
                                                variant="ghost"
                                                className="text-xs text-slate-500 underline opacity-90 hover:opacity-100 hover:bg-transparent h-auto p-0 whitespace-normal text-center max-w-[200px] mt-1"
                                                onClick={() => navigate('/wellness/dashboard/documents')}
                                            >
                                                Upload your documents now for review and analysis
                                            </Button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </Card>

                    {/* <WebsiteComplianceWidget
                        hasScannedWebsite={hasScannedWebsite}
                        scanResults={scanResults}
                        onOpenScanModal={() => setIsWebsiteScanModalOpen(true)}
                    /> */}

                    {/* Need a Pro Card */}
                    <div className="hidden md:block">
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
            </div >

            {/* Document Viewer Modal */}
            {viewerDoc && (
                <DocumentViewerModal
                    isOpen={!!viewerDoc}
                    onClose={() => {
                        setViewerDoc(null);
                        setViewerContent('');
                    }}
                    title={viewerDoc.title}
                    content={viewerContent}
                    onDownload={() => handleDownloadDocument(viewerDoc)}
                />
            )}

            {/* Copyable Document Modal */}
            {copyableDoc && (
                <CopyableDocumentModal
                    isOpen={!!copyableDoc}
                    onClose={() => {
                        setCopyableDoc(null);
                        setCopyableHtmlContent('');
                    }}
                    title={copyableDoc.title}
                    htmlContent={copyableHtmlContent}
                    isLoading={isLoadingHtml}
                />
            )}
        </div >
    );
};
