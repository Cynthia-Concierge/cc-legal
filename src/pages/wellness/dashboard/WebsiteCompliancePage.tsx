import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';
import { Globe, AlertTriangle, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { WebsiteScanModal } from '../../../components/wellness/WebsiteScanModal';
import { supabase } from '../../../lib/supabase';

interface ScanResultSummary {
  websiteUrl?: string;
  timestamp?: string;
  foundDocuments: Array<{
    name: string;
    url: string;
    content: string;
  }>;
  missingDocuments: string[];
  issues: Array<{
    document: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    whyItMatters: string;
  }>;
  summary: string;
}

export const WebsiteCompliancePage: React.FC = () => {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [hasScannedWebsite, setHasScannedWebsite] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResultSummary | null>(null);
  const [answers, setAnswers] = useState<any>(null);

  useEffect(() => {
    // Load saved answers to get website URL
    const saved = localStorage.getItem('wellness_onboarding_answers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      } catch (e) {
        console.error('Error parsing answers:', e);
      }
    }

    // Load scan results
    const savedScan = localStorage.getItem('wellness_website_scan_result');
    if (savedScan) {
      try {
        const results = JSON.parse(savedScan);
        setScanResults(results);
        setHasScannedWebsite(true);
      } catch (e) {
        console.error('Error parsing scan results:', e);
      }
    }

    // Check if user has scanned website from database
    const checkScanStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('business_profiles')
            .select('has_scanned_website, website_scan_results')
            .eq('user_id', user.id)
            .single();

          if (data?.has_scanned_website && data?.website_scan_results) {
            setHasScannedWebsite(true);
            setScanResults(data.website_scan_results);
          }
        }
      } catch (e) {
        console.error('Error checking scan status:', e);
      }
    };

    checkScanStatus();
  }, []);

  const handleScanComplete = () => {
    setIsScanModalOpen(false);
    setHasScannedWebsite(true);
    // Reload scan results
    const savedScan = localStorage.getItem('wellness_website_scan_result');
    if (savedScan) {
      try {
        setScanResults(JSON.parse(savedScan));
      } catch (e) {
        console.error('Error parsing scan results:', e);
      }
    }
  };

  const missingCount = scanResults?.missingDocuments?.length || 0;
  const highIssues = scanResults?.issues?.filter((i) => i.severity === 'high') || [];
  const mediumIssues = scanResults?.issues?.filter((i) => i.severity === 'medium') || [];
  const lowIssues = scanResults?.issues?.filter((i) => i.severity === 'low') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 rounded-lg text-brand-600 flex-shrink-0">
            <Globe size={24} className="md:w-7 md:h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Website Compliance
          </h1>
        </div>
        <p className="text-slate-600 text-sm md:text-base ml-10 md:ml-14">
          Scan your website to identify missing legal documents and compliance issues
        </p>
      </div>

      {/* Scan Modal */}
      <WebsiteScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onComplete={handleScanComplete}
        initialWebsite={answers?.website || ''}
        initialResults={scanResults}
      />

      {/* Main Content */}
      {!hasScannedWebsite || !scanResults ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-brand-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <Globe className="text-brand-600" size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Scan Your Website</h2>
              <p className="text-slate-600">
                We haven&apos;t scanned your website yet. Run a quick check to find missing policies, compliance issues, and areas that need attention.
              </p>
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700 text-white mt-6"
                onClick={() => setIsScanModalOpen(true)}
              >
                <Globe className="mr-2 h-4 w-4" />
                Start Website Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="text-brand-600" size={20} />
                  Scan Results
                </CardTitle>
                {scanResults.websiteUrl && (
                  <a
                    href={scanResults.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    View Website
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              {scanResults.timestamp && (
                <p className="text-xs text-slate-500 mt-1">
                  Last scanned: {new Date(scanResults.timestamp).toLocaleString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-slate-600" size={18} />
                    <span className="text-sm font-semibold text-slate-700">Found Documents</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {scanResults.foundDocuments?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-orange-600" size={18} />
                    <span className="text-sm font-semibold text-orange-700">Missing Documents</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{missingCount}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-red-600" size={18} />
                    <span className="text-sm font-semibold text-red-700">Issues Found</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {highIssues.length + mediumIssues.length + lowIssues.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missing Documents */}
          {missingCount > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={20} />
                  Missing Documents ({missingCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanResults.missingDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2"
                    >
                      <AlertTriangle className="text-orange-600 flex-shrink-0" size={18} />
                      <span className="text-sm font-medium text-orange-900">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Found Documents */}
          {scanResults.foundDocuments && scanResults.foundDocuments.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  Found Documents ({scanResults.foundDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanResults.foundDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
                        <span className="text-sm font-medium text-emerald-900">{doc.name}</span>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          View
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues */}
          {(highIssues.length > 0 || mediumIssues.length > 0 || lowIssues.length > 0) && (
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  Issues Found ({highIssues.length + mediumIssues.length + lowIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* High Priority Issues */}
                  {highIssues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        High Priority ({highIssues.length})
                      </h3>
                      <div className="space-y-2">
                        {highIssues.map((issue, idx) => (
                          <div
                            key={`high-${idx}`}
                            className="p-4 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900">
                                  {issue.document}
                                </p>
                                <p className="text-sm text-red-700 mt-1">{issue.issue}</p>
                                {issue.whyItMatters && (
                                  <p className="text-xs text-red-600 mt-2 italic">
                                    Why it matters: {issue.whyItMatters}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium Priority Issues */}
                  {mediumIssues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Medium Priority ({mediumIssues.length})
                      </h3>
                      <div className="space-y-2">
                        {mediumIssues.map((issue, idx) => (
                          <div
                            key={`med-${idx}`}
                            className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-orange-900">
                                  {issue.document}
                                </p>
                                <p className="text-sm text-orange-700 mt-1">{issue.issue}</p>
                                {issue.whyItMatters && (
                                  <p className="text-xs text-orange-600 mt-2 italic">
                                    Why it matters: {issue.whyItMatters}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Low Priority Issues */}
                  {lowIssues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Low Priority ({lowIssues.length})
                      </h3>
                      <div className="space-y-2">
                        {lowIssues.map((issue, idx) => (
                          <div
                            key={`low-${idx}`}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {issue.document}
                                </p>
                                <p className="text-sm text-slate-700 mt-1">{issue.issue}</p>
                                {issue.whyItMatters && (
                                  <p className="text-xs text-slate-600 mt-2 italic">
                                    Why it matters: {issue.whyItMatters}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => setIsScanModalOpen(true)}
            >
              <Globe className="mr-2 h-4 w-4" />
              Run New Scan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

