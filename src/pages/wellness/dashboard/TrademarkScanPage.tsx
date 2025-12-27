import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';
import { Search, ShieldAlert, CheckCircle2, CheckCircle, FileText } from 'lucide-react';
import { TrademarkQuizModal } from '../../../components/wellness/TrademarkQuizModal';
import { CalendlyModal } from '../../../components/wellness/CalendlyModal';

export const TrademarkScanPage: React.FC = () => {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    // Load saved business name from onboarding
    const saved = localStorage.getItem('wellness_onboarding_answers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) {
          setBusinessName(parsed.businessName);
        }
      } catch (e) {
        console.error('[TrademarkScanPage] Error parsing onboarding answers:', e);
      }
    }
  }, []);

  // Simplified: Modal handles entire flow including email submission
  const handleScanComplete = () => {
    console.log('[TrademarkScanPage] Scan completed');
    setIsScanModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 rounded-lg text-brand-600 flex-shrink-0">
            <ShieldAlert size={24} className="md:w-7 md:h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Trademark Risk Scan
          </h1>
        </div>
        <p className="text-slate-600 text-sm md:text-base ml-10 md:ml-14">
          Get instant trademark risk assessment and a free detailed report
        </p>
      </div>

      {/* Modals */}
      <TrademarkQuizModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onComplete={handleScanComplete}
        businessName={businessName}
        onBookCall={() => {
          setIsScanModalOpen(false);
          setIsCalendlyModalOpen(true);
        }}
      />
      <CalendlyModal
        isOpen={isCalendlyModalOpen}
        onClose={() => setIsCalendlyModalOpen(false)}
      />

      {/* Main Content */}
      <Card className="border-none shadow-md">
        <CardContent className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl">
                <Search className="text-brand-600 w-16 h-16" />
              </div>

              {/* Heading */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                  Check Your Brand's Trademark Risk
                </h2>
                <p className="text-lg text-slate-600">
                  Scan 2.8 million USPTO trademarks in seconds and get your free risk assessment report
                </p>
              </div>

              {/* What You'll Get */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-left">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  What You'll Get (100% Free):
                </h3>
                <ul className="space-y-3 text-blue-800">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <strong>Instant USPTO Database Scan</strong> — Check for conflicts across 2.8 million registered trademarks
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <strong>Risk Level Assessment</strong> — Get your trademark risk score (HIGH, MODERATE, or LOW)
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <strong>Free PDF Report</strong> — Detailed analysis with conflicting trademarks and next steps
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <strong>Optional Attorney Review</strong> — Book a free consultation to discuss your results
                    </div>
                  </li>
                </ul>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Instant results</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>100% free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full sm:w-auto px-8 py-6 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => setIsScanModalOpen(true)}
              >
                <Search className="mr-2 h-5 w-5" />
                Start Free Trademark Scan
              </Button>

              <p className="text-xs text-slate-500">
                Takes less than 60 seconds • Results delivered instantly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-brand-600" size={20} />
            Why Trademark Protection Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Protect Your Brand</h4>
              <p className="text-sm text-slate-600">
                Secure exclusive rights to your business name before someone else does
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Avoid Costly Rebranding</h4>
              <p className="text-sm text-slate-600">
                Identify conflicts early to avoid expensive legal battles and forced name changes
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Increase Business Value</h4>
              <p className="text-sm text-slate-600">
                Protected trademarks significantly increase your business's value for future sales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

