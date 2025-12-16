import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';
import { Search, ShieldAlert, CheckCircle2, FileText, Phone, Mail, Download, Loader2 } from 'lucide-react';
import { TrademarkQuizModal } from '../../../components/wellness/TrademarkQuizModal';
import { CalendlyModal } from '../../../components/wellness/CalendlyModal';
import { supabase } from '../../../lib/supabase';

export const TrademarkScanPage: React.FC = () => {
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; risk: string } | null>(null);
  const [answers, setAnswers] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [quizData, setQuizData] = useState<{ answers: number[], answerDetails: any[] } | null>(null);

  useEffect(() => {
    // Load saved answers to get business name
    const saved = localStorage.getItem('wellness_onboarding_answers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      } catch (e) {
        console.error('Error parsing answers:', e);
      }
    }

    // Load quiz result
    const savedResult = localStorage.getItem('wellness_trademark_result');
    if (savedResult) {
      try {
        const result = JSON.parse(savedResult);
        setQuizResult(result);
        setHasTakenQuiz(true);
      } catch (e) {
        console.error('Error parsing quiz result:', e);
      }
    }

    // Load quiz data (answers and answerDetails) if available
    // This is stored when the quiz is submitted
    const savedQuizData = localStorage.getItem('wellness_trademark_quiz_data');
    if (savedQuizData) {
      try {
        const data = JSON.parse(savedQuizData);
        setQuizData(data);
      } catch (e) {
        console.error('Error parsing quiz data:', e);
      }
    }

    // Check if user has taken quiz from database
    const checkQuizStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('trademark_requests')
            .select('quiz_score, risk_level, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data) {
            setHasTakenQuiz(true);
            setQuizResult({
              score: data.quiz_score || 0,
              risk: data.risk_level || 'MODERATE RISK',
            });
          }
        }
      } catch (e) {
        console.error('Error checking quiz status:', e);
      }
    };

    checkQuizStatus();
  }, []);

  const handleQuizComplete = (score: number, risk: string, quizDataFromModal?: { answers: number[], answerDetails: any[] }) => {
    console.log('[TrademarkScanPage] handleQuizComplete called with:', { score, risk, quizDataFromModal });
    const result = { score, risk };
    setQuizResult(result);
    setHasTakenQuiz(true);
    setIsQuizModalOpen(false);
    localStorage.setItem('wellness_trademark_result', JSON.stringify(result));

    // Use quiz data passed directly from modal, or try to load from localStorage
    if (quizDataFromModal) {
      console.log('[TrademarkScanPage] ✅ Received quiz data from modal:', quizDataFromModal);
      setQuizData(quizDataFromModal);
      // Also store it for persistence
      localStorage.setItem('wellness_trademark_quiz_data', JSON.stringify(quizDataFromModal));
    } else {
      console.warn('[TrademarkScanPage] ⚠️ No quiz data passed from modal, trying localStorage...');
      // Fallback: reload quiz data from localStorage
      const savedQuizData = localStorage.getItem('wellness_trademark_quiz_data');
      if (savedQuizData) {
        try {
          const data = JSON.parse(savedQuizData);
          console.log('[TrademarkScanPage] ✅ Loaded quiz data from localStorage:', data);
          setQuizData(data);
        } catch (e) {
          console.error('[TrademarkScanPage] ❌ Error parsing quiz data:', e);
        }
      } else {
        console.warn('[TrademarkScanPage] ❌ Quiz data not found in localStorage');
      }
    }
  };

  const handleDownloadPDF = async () => {
    console.log('[TrademarkScanPage] handleDownloadPDF called', {
      hasQuizResult: !!quizResult,
      hasAnswers: !!answers,
      hasQuizData: !!quizData,
      quizResult,
      answers,
      quizData
    });

    if (!quizResult || !answers || !quizData) {
      console.error('❌ Missing quiz data for PDF download', {
        hasQuizResult: !!quizResult,
        hasAnswers: !!answers,
        hasQuizData: !!quizData,
        quizData
      });
      // Try to reload from localStorage one more time
      const savedQuizData = localStorage.getItem('wellness_trademark_quiz_data');
      if (savedQuizData) {
        try {
          const data = JSON.parse(savedQuizData);
          setQuizData(data);
          console.log('[TrademarkScanPage] Reloaded quiz data from localStorage');
          // Retry after a brief delay
          setTimeout(() => {
            if (data) {
              handleDownloadPDF();
            }
          }, 100);
          return;
        } catch (e) {
          console.error('Error parsing quiz data:', e);
        }
      }
      alert('Quiz data not found. Please retake the quiz to enable PDF download.');
      return;
    }

    setIsDownloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to download your report');
        setIsDownloading(false);
        return;
      }

      const response = await fetch('/api/trademarks/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          businessName: answers.businessName || 'Your Business',
          score: quizResult.score,
          riskLevel: quizResult.risk,
          answers: quizData.answers,
          answerDetails: quizData.answerDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trademark-Risk-Report-${(answers.businessName || 'Your-Business').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(`Error downloading PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel.includes('HIGH')) return 'bg-red-50 text-red-700 border-red-200';
    if (riskLevel.includes('MODERATE')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getRiskDescription = (riskLevel: string) => {
    if (riskLevel.includes('HIGH')) {
      return 'Your brand shows high trademark risk. Immediate action is recommended before investing further in branding or expansion.';
    }
    if (riskLevel.includes('MODERATE')) {
      return 'Your brand shows moderate trademark risk. Additional protection is recommended before expansion or major brand investment.';
    }
    return 'Your brand shows low immediate trademark risk, but additional protection is recommended before expansion or major brand investment.';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 rounded-lg text-brand-600 flex-shrink-0">
            <Search size={24} className="md:w-7 md:h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Trademark Risk Scan
          </h1>
        </div>
        <p className="text-slate-600 text-sm md:text-base ml-10 md:ml-14">
          Assess your brand&apos;s trademark risk and get a preliminary risk report
        </p>
      </div>

      {/* Modals */}
      <TrademarkQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => {
          setIsQuizModalOpen(false);
          // Reload quiz data when modal closes (in case it was just stored)
          const savedQuizData = localStorage.getItem('wellness_trademark_quiz_data');
          if (savedQuizData) {
            try {
              const data = JSON.parse(savedQuizData);
              setQuizData(data);
            } catch (e) {
              console.error('Error parsing quiz data:', e);
            }
          }
        }}
        onComplete={handleQuizComplete}
        businessName={answers?.businessName || ''}
        onBookCall={() => setIsCalendlyModalOpen(true)}
      />
      <CalendlyModal isOpen={isCalendlyModalOpen} onClose={() => setIsCalendlyModalOpen(false)} />

      {/* Main Content */}
      {!hasTakenQuiz || !quizResult ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-brand-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <Search className="text-brand-600" size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Trademark Risk Assessment</h2>
              <p className="text-slate-600">
                Take our quick quiz to assess your brand&apos;s trademark risk. We&apos;ll analyze your answers and send you a preliminary trademark risk report via email.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mt-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">What you&apos;ll get:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Preliminary risk assessment based on your answers</li>
                  <li>• PDF report emailed to you</li>
                  <li>• Risk factors and recommendations</li>
                  <li>• Next steps for protection</li>
                </ul>
              </div>
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700 text-white mt-6"
                onClick={() => setIsQuizModalOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Start Trademark Risk Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Results Summary Card */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="text-brand-600" size={20} />
                Your Trademark Risk Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Risk Level Badge */}
                <div className={`p-4 rounded-lg border ${getRiskColor(quizResult.risk)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1">
                        Risk Level
                      </p>
                      <p className="text-2xl font-bold">{quizResult.risk}</p>
                      <p className="text-sm mt-2 opacity-90">
                        {getRiskDescription(quizResult.risk)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1">
                        Risk Score
                      </p>
                      <p className="text-3xl font-bold">{quizResult.score}</p>
                      <p className="text-xs mt-1 opacity-75">out of 40</p>
                    </div>
                  </div>
                </div>

                {/* Email Sent Notice */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900">
                        Report Sent to Your Email
                      </p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Your preliminary trademark risk report has been sent to your email address.
                        Check your inbox for your PDF report with detailed risk factors and
                        recommendations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="flex justify-center">
                  <Button
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading || !quizData}
                    title={!quizData ? 'Please retake the quiz to enable PDF download' : ''}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF Report
                      </>
                    )}
                  </Button>
                </div>
                {!quizData && (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-slate-500 mt-2">
                      Note: Retake the quiz to enable PDF download with your latest answers
                    </p>
                    <button
                      onClick={() => {
                        // Debug: Check localStorage
                        const saved = localStorage.getItem('wellness_trademark_quiz_data');
                        console.log('Quiz data in localStorage:', saved);
                        if (saved) {
                          try {
                            const data = JSON.parse(saved);
                            setQuizData(data);
                            console.log('Quiz data loaded:', data);
                          } catch (e) {
                            console.error('Error parsing:', e);
                          }
                        }
                      }}
                      className="text-xs text-brand-600 hover:text-brand-700 underline"
                    >
                      (Debug: Reload quiz data)
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What's Next Card */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-brand-600" size={20} />
                What&apos;s Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    1. Review Your Report
                  </p>
                  <p className="text-sm text-slate-600">
                    Check your email for the detailed PDF report. It includes your risk factors,
                    what they mean, and priority recommendations.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    2. Consider Next Steps
                  </p>
                  <p className="text-sm text-slate-600">
                    Based on your risk level, you may want to:
                  </p>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1 ml-4 list-disc">
                    <li>Run a comprehensive trademark search</li>
                    <li>Consult with an attorney about registration</li>
                    <li>Develop a brand protection strategy</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    3. Optional: Attorney Review
                  </p>
                  <p className="text-sm text-slate-600">
                    If you&apos;d like, our legal team can walk through your results and explain
                    whether a formal trademark search makes sense for your situation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => setIsQuizModalOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Retake Assessment
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsCalendlyModalOpen(true)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Book Attorney Review Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

