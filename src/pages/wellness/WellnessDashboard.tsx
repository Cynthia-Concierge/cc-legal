import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAnswers, ScoreResult, RecommendationResult, DocumentItem, DashboardState } from '../../types/wellness';
import { calculateScore } from '../../lib/wellness/scoring';
import { getRecommendedDocuments } from '../../lib/wellness/documentEngine';
import { calculateLegalHealth, getNextBestAction, NextAction } from '../../lib/wellness/dashboardLogic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/wellness/ui/Card';
import { Button } from '../../components/wellness/ui/Button';
import { Lock, Unlock, Download, AlertTriangle, Shield, CheckCircle2, Phone, ArrowRight, FileText, Star, Wand2, Store, ExternalLink, LogOut, Search, Globe } from 'lucide-react';
import { DraftingModal } from '../../components/wellness/DraftingModal';
import { CalendlyModal } from '../../components/wellness/CalendlyModal';
import { ContractReviewModal } from '../../components/wellness/ContractReviewModal';
import { OnboardingStepsTracker } from '../../components/wellness/OnboardingStepsTracker';
import { WebsiteScanModal } from '../../components/wellness/WebsiteScanModal';
import { LegalHealthProgress } from '../../components/wellness/dashboard/LegalHealthProgress';
import { NextActionWidget } from '../../components/wellness/dashboard/NextActionWidget';
import { DocumentVault } from '../../components/wellness/vault/DocumentVault';
import { supabase } from '../../lib/supabase';
import { TrademarkQuizModal } from '../../components/wellness/TrademarkQuizModal';

export const WellnessDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'website' | 'ip'>('documents');

  // Drafting Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calendly Modal State
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  // Contract Review Modal State
  const [isContractReviewModalOpen, setIsContractReviewModalOpen] = useState(false);

  // Website Scan Modal State
  const [isWebsiteScanModalOpen, setIsWebsiteScanModalOpen] = useState(false);

  // Trademark Modal State
  const [isTrademarkModalOpen, setIsTrademarkModalOpen] = useState(false);


  // Track onboarding progress
  const [hasScannedWebsite, setHasScannedWebsite] = useState(false);
  const [hasCompletedContractReview, setHasCompletedContractReview] = useState(false);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      // If Supabase is configured, check for session
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
          } else {
            // No session - check if they have localStorage data (legacy users)
            // If they do, allow them to continue but suggest setting up password
            const saved = localStorage.getItem('wellness_onboarding_answers');
            if (!saved) {
              // No session and no saved data - redirect to login
              navigate('/wellness/login');
              return;
            }
          }
        } catch (err) {
          console.error('Error checking auth:', err);
        }
      } else {
        // Supabase not configured - fall back to localStorage check
        const saved = localStorage.getItem('wellness_onboarding_answers');
        if (!saved) {
          navigate('/wellness/onboarding');
          return;
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  // Load dashboard data
  useEffect(() => {
    if (isCheckingAuth) return;

    const saved = localStorage.getItem('wellness_onboarding_answers');
    if (!saved) {
      navigate('/wellness/onboarding');
      return;
    }
    const parsedAnswers = JSON.parse(saved);
    setAnswers(parsedAnswers);

    // Calculate results
    const score = calculateScore(parsedAnswers);
    const recs = getRecommendedDocuments(parsedAnswers);

    setScoreData(score);
    setRecommendations(recs);

    // Load onboarding progress from localStorage
    const progress = localStorage.getItem('wellness_onboarding_progress');
    if (progress) {
      try {
        const parsed = JSON.parse(progress);
        setHasScannedWebsite(parsed.hasScannedWebsite || false);
        setHasCompletedContractReview(parsed.hasCompletedContractReview || false);
      } catch (e) {
        console.error('Error parsing onboarding progress:', e);
      }
    }
  }, [navigate, isCheckingAuth]);

  // Compute Dashboard State & Logic
  const dashboardState: DashboardState | null = useMemo(() => {
    if (!answers || !scoreData || !recommendations) return null;
    return {
      answers,
      score: scoreData,
      recommendations,
      progress: {
        hasScannedWebsite,
        hasCompletedContractReview
      }
    };
  }, [answers, scoreData, recommendations, hasScannedWebsite, hasCompletedContractReview]);

  const legalHealthScore = dashboardState ? calculateLegalHealth(dashboardState) : 0;
  const nextAction = dashboardState ? getNextBestAction(dashboardState) : null;

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Clear localStorage
    localStorage.removeItem('wellness_onboarding_answers');
    navigate('/wellness/login');
  };

  const handleDraftClick = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const handleWebsiteScanComplete = () => {
    setHasScannedWebsite(true);
    setIsWebsiteScanModalOpen(false);
    // Save progress
    const progress = {
      hasScannedWebsite: true,
      hasCompletedContractReview,
    };
    localStorage.setItem('wellness_onboarding_progress', JSON.stringify(progress));
  };

  const handleContractReviewComplete = () => {
    setHasCompletedContractReview(true);
    setIsContractReviewModalOpen(false);
    // Save progress
    const progress = {
      hasScannedWebsite,
      hasCompletedContractReview: true,
    };
    localStorage.setItem('wellness_onboarding_progress', JSON.stringify(progress));
  };

  const handleActionClick = (action: NextAction) => {
    switch (action.actionType) {
      case 'profile':
        navigate('/wellness/profile');
        break;
      case 'scan':
        setIsWebsiteScanModalOpen(true);
        break;
      case 'review':
        setIsContractReviewModalOpen(true);
        break;
      case 'draft':
        if (action.targetId) {
          const doc = recommendations?.topPriorities.find(d => d.id === action.targetId);
          if (doc) handleDraftClick(doc);
        }
        break;
      case 'call':
        setIsCalendlyModalOpen(true);
        break;
    }
  };

  const handleDownloadPDF = (doc: DocumentItem) => {
    if (doc.pdfPath) {
      // Extract filename from path
      const pathParts = doc.pdfPath.split('/');
      const fileName = pathParts[pathParts.length - 1];

      // Simple direct download - Vite serves /public at root
      const link = document.createElement('a');
      link.href = `/pdfs/${fileName}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.remove();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!answers || !scoreData || !recommendations) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading your profile...</div>;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Moderate': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  const getScoreExplanation = (level: string) => {
    switch (level) {
      case 'High':
        return "Your business model involves high-liability activities such as retreats or physical instruction. This score indicates a critical need for robust waivers and detailed agreements to mitigate significant potential legal exposure.";
      case 'Moderate':
        return "Your operations have standard industry risks. You have specific liability triggers—like hiring staff or collecting online payments—that require tailored contracts to prevent disputes and protect revenue.";
      default: // Low
        return "Your exposure is currently limited. However, foundational legal documents are still required to operate professionally, protect your brand, and comply with consumer protection laws.";
    }
  };

  const isProfileComplete = answers.isProfileComplete;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Drafting Modal Integration */}
      {selectedDoc && (
        <DraftingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          documentItem={selectedDoc}
          userAnswers={answers}
        />
      )}

      {/* Calendly Modal */}
      <CalendlyModal
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
      />

      {/* Contract Review Modal */}
      <ContractReviewModal
        isOpen={isContractReviewModalOpen}
        onClose={() => setIsContractReviewModalOpen(false)}
        onComplete={handleContractReviewComplete}
      />

      {/* Website Scan Modal */}
      <WebsiteScanModal
        isOpen={isWebsiteScanModalOpen}
        onClose={() => setIsWebsiteScanModalOpen(false)}
        onComplete={handleWebsiteScanComplete}
        initialWebsite={answers.website}
      />

      {/* Trademark Quiz Modal */}
      <TrademarkQuizModal
        isOpen={isTrademarkModalOpen}
        onClose={() => setIsTrademarkModalOpen(false)}
        onComplete={() => setIsTrademarkModalOpen(false)}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-brand-600" size={24} />
            <span className="font-semibold text-slate-900">Conscious Counsel</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Legal Health Progress */}
            <LegalHealthProgress score={legalHealthScore} />

            {!isProfileComplete && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/wellness/profile')}
                className="hidden md:flex items-center gap-2"
              >
                <Store size={16} />
                Complete Profile
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setIsCalendlyModalOpen(true)} className="hidden sm:enable">
              Book Call
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Simplified Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.email ? `Hello, ${user.email.split('@')[0]}` : 'Welcome Back'}
          </h1>
          <p className="text-slate-600">
            Manage your legal protection in 3 simple steps.
          </p>
        </div>

        {/* Mobile-First Tabs/Navigation */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'documents' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('website')}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'website' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Website
          </button>
          <button
            onClick={() => setActiveTab('ip')}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'ip' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            IP & Brand
          </button>
        </div>

        {/* TAB CONTENT: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* 1. Missing / Recommended Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="text-brand-600" size={20} />
                  Missing Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.topPriorities.length > 0 ? (
                  recommendations.topPriorities.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full border border-red-100 text-red-500">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-500">Critical Protection</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleDraftClick(doc)}>Draft</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-slate-500 text-sm">
                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                    All critical documents drafted!
                  </div>
                )}

                {/* Show Advanced items if any */}
                {recommendations.advancedTemplates.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-400">
                        <Lock size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                        <p className="text-xs text-slate-500">Advanced Protection</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setIsCalendlyModalOpen(true)}>Book Call</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 2. Your Vault (Uploaded/Drafted) */}
            <DocumentVault />
          </div>
        )}

        {/* TAB CONTENT: WEBSITE */}
        {activeTab === 'website' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="text-brand-600" size={20} />
                  Website Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Ensure your website has the legally required disclaimers and policies.
                </p>

                {hasScannedWebsite ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="text-green-600" size={24} />
                    <div>
                      <p className="font-medium text-slate-900">Scan Complete</p>
                      <p className="text-xs text-slate-600">Your website report is saved in your vault.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600" size={24} />
                    <div>
                      <p className="font-medium text-slate-900">Not Scanned Yet</p>
                      <p className="text-xs text-slate-600">Scan your site to identify missing policies.</p>
                    </div>
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={() => setIsWebsiteScanModalOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {hasScannedWebsite ? 'Re-Scan Website' : 'Scan My Website'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB CONTENT: IP PROTECTION */}
        {activeTab === 'ip' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="text-brand-600" size={20} />
                  IP & Trademark Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Check if your brand name is available and secure your intellectual property.
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Why trademark?</h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                    <li>Prevent others from using your name</li>
                    <li>Increase business valuation</li>
                    <li>Legal ownership of your brand</li>
                  </ul>
                </div>
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => setIsTrademarkModalOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Start Free Trademark Search
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
};
