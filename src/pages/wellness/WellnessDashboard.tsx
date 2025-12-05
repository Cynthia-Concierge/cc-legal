import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAnswers, ScoreResult, RecommendationResult, DocumentItem } from '../../types/wellness';
import { calculateScore } from '../../lib/wellness/scoring';
import { getRecommendedDocuments } from '../../lib/wellness/documentEngine';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/wellness/ui/Card';
import { Button } from '../../components/wellness/ui/Button';
import { Lock, Unlock, Download, AlertTriangle, Shield, CheckCircle2, Phone, ArrowRight, FileText, Star, Wand2, Store, ExternalLink, LogOut, Search, Globe } from 'lucide-react';
import { DraftingModal } from '../../components/wellness/DraftingModal';
import { CalendlyModal } from '../../components/wellness/CalendlyModal';
import { ContractReviewModal } from '../../components/wellness/ContractReviewModal';
import { OnboardingStepsTracker } from '../../components/wellness/OnboardingStepsTracker';
import { WebsiteScanModal } from '../../components/wellness/WebsiteScanModal';
import { supabase } from '../../lib/supabase';

export const WellnessDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  
  // Drafting Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calendly Modal State
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  
  // Contract Review Modal State
  const [isContractReviewModalOpen, setIsContractReviewModalOpen] = useState(false);
  
  // Website Scan Modal State
  const [isWebsiteScanModalOpen, setIsWebsiteScanModalOpen] = useState(false);
  
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
      link.click();
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
    switch(level) {
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

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-brand-600" size={24} />
            <span className="font-semibold text-slate-900">Wellness Legal Guard</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Setup Progress Indicator */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SETUP PROGRESS</span>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-600 transition-all duration-500"
                  style={{ 
                    width: `${((isProfileComplete ? 1 : 0) + (hasScannedWebsite ? 1 : 0) + (hasCompletedContractReview ? 1 : 0)) / 4 * 100}%` 
                  }}
                />
              </div>
            </div>
            {!isProfileComplete && (
              <Button 
                size="sm" 
                variant="primary" 
                onClick={() => navigate('/wellness/profile')}
                className="flex items-center gap-2"
              >
                <Store size={16} />
                Complete Profile
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setIsCalendlyModalOpen(true)}>
              Book Consultation
            </Button>
            {user && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Welcome Section */}
        <section>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome</h1>
            <p className="text-lg text-slate-600">
              Here is your personalized legal roadmap to protect your business.
            </p>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Column: Onboarding Steps Tracker */}
          <div className="lg:col-span-8 space-y-6">
            <OnboardingStepsTracker
              answers={answers}
              onCompleteProfile={() => navigate('/wellness/profile')}
              onScanWebsite={() => setIsWebsiteScanModalOpen(true)}
              onReviewDocuments={() => setIsContractReviewModalOpen(true)}
              onDraftDocument={(docId) => {
                const doc = recommendations.topPriorities.find(d => d.id === docId) || 
                           recommendations.freeTemplates.find(d => d.id === docId) ||
                           recommendations.advancedTemplates.find(d => d.id === docId);
                if (doc) {
                  handleDraftClick(doc);
                }
              }}
              hasCompletedContractReview={hasCompletedContractReview}
              hasScannedWebsite={hasScannedWebsite}
              priorityDocumentId={recommendations?.topPriorities[0]?.id}
            />

            {/* High Priority Documents - Hidden from UI for now */}
            {/* Section removed from UI but functionality preserved */}
          </div>

          {/* Right Column: Risk Score & Business Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Risk Score Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
              <div className={`p-6 flex flex-col items-center ${getRiskColor(scoreData.riskLevel)} rounded-t-lg`}>
                <span className="text-xs font-bold tracking-wider uppercase mb-3 opacity-80">Risk Score</span>
                <div className="relative mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      className="text-white opacity-20"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <circle
                      className="text-current transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * scoreData.score) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{scoreData.score}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/50 border border-current`}>
                  {scoreData.riskLevel === 'Low' ? 'LOW EXPOSURE' : scoreData.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="p-6 bg-white">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your business model includes {answers.services.length} service{answers.services.length !== 1 ? 's' : ''} and specific risks like {answers.hasPhysicalMovement ? 'physical movement' : 'operational activities'}.
                </p>
              </div>
            </Card>

            {/* Need a Pro Card */}
            <Card className="bg-slate-900 text-white border-none">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Need a Pro?</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Get a certified wellness lawyer to review your final setup.
                </p>
                <Button 
                  onClick={() => setIsCalendlyModalOpen(true)}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Book Free Call
                </Button>
              </CardContent>
            </Card>

            {/* Related Services */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer" onClick={() => setIsContractReviewModalOpen(true)}>
                  <Search className="text-brand-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contract Review</p>
                    <p className="text-xs text-slate-600">Analyze existing waivers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer" onClick={() => setIsWebsiteScanModalOpen(true)}>
                  <Globe className="text-brand-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Website Scanner</p>
                    <p className="text-xs text-slate-600">Check compliance.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* Free Templates */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <Unlock className="text-brand-600" size={20} />
             <h2 className="text-xl font-bold text-slate-900">Free Templates</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.freeTemplates.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow group cursor-pointer border-l-4 border-l-brand-500">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <FileText className="text-slate-400 group-hover:text-brand-600 transition-colors" size={24} />
                    <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Free</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{doc.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{doc.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth 
                    className="gap-2 group-hover:border-brand-200"
                    onClick={() => handleDownloadPDF(doc)}
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Advanced Templates (Locked) */}
        {recommendations.advancedTemplates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
               <Lock className="text-slate-400" size={20} />
               <h2 className="text-xl font-bold text-slate-900">Recommended: Advanced Protection</h2>
            </div>
            <p className="text-slate-500 mb-6 px-1">These documents require real lawyers to review and customize for your specific business model.</p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.advancedTemplates.map((doc) => (
              <Card key={doc.id} className="bg-slate-50 border-slate-200 opacity-75 relative group hover:opacity-100 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <FileText className="text-slate-300 group-hover:text-slate-400 transition-colors" size={24} />
                    <Lock className="text-slate-400" size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-600 mb-1 group-hover:text-slate-700 transition-colors">{doc.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 group-hover:text-slate-500 transition-colors">{doc.description}</p>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 italic mb-3">
                      Requires lawyer review
                    </p>
                    {/* Schedule a Call Button - appears on hover */}
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCalendlyModalOpen(true);
                      }}
                    >
                      <Phone size={14} />
                      Schedule a Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        )}

        {/* Final CTA */}
        <section className="mt-12 bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
           <div className="max-w-2xl mx-auto space-y-6">
             <h2 className="text-3xl font-bold">Want a lawyer to review your setup?</h2>
             <p className="text-brand-50 text-lg">
               Don't leave your studio's safety to chance. Book a free 15-minute legal strategy call with our team to customize your protection plan.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white !text-black hover:bg-slate-100 border-none shadow-lg text-lg px-8 font-semibold"
                  onClick={() => setIsCalendlyModalOpen(true)}
                >
                  <Phone className="mr-2 h-5 w-5 !text-black" />
                  Book My Call
                </Button>
             </div>
             <p className="text-sm text-brand-200 pt-2 opacity-80">No credit card required. 100% Free consultation.</p>
           </div>
        </section>

      </main>
    </div>
  );
};
