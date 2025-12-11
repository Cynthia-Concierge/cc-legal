import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Globe, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface WebsiteScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialWebsite?: string;
  initialResults?: ScanResult | null;
}

interface ScanResult {
  foundDocuments: string[];
  missingDocuments: string[];
  issues: Array<{
    document: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    whyItMatters: string;
  }>;
  summary: string;
}

export const WebsiteScanModal: React.FC<WebsiteScanModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialWebsite = '',
  initialResults = null,
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(initialResults);
  const [error, setError] = useState<string | null>(null);

  // Update state when initialResults changes (e.g. if loaded after mount)
  useEffect(() => {
    if (initialResults) {
      setScanResult(initialResults);
    }
  }, [initialResults]);

  const handleScan = async () => {
    if (!websiteUrl || !websiteUrl.trim()) {
      setError('Please enter a valid website URL');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Normalize URL
      let normalizedUrl = websiteUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const response = await fetch('/api/scan-website-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: normalizedUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to scan website');
      }

      const data = await response.json();

      // Extract analysis result from the response
      if (data.analysis) {
        const result: ScanResult = {
          foundDocuments: data.analysis.foundDocuments || [],
          missingDocuments: data.analysis.missingDocuments || [],
          issues: data.analysis.issues || [],
          summary: data.analysis.summary || 'Website scan completed.',
        };

        setScanResult(result);

        // Save to localStorage for persistence
        localStorage.setItem('wellness_website_scan_result', JSON.stringify({
          ...result,
          websiteUrl: normalizedUrl,
          timestamp: new Date().toISOString()
        }));
      } else {
        // If no analysis, create a basic result
        const result: ScanResult = {
          foundDocuments: [],
          missingDocuments: [],
          issues: [],
          summary: 'Website scan completed. No major issues found.',
        };
        setScanResult(result);
      }
    } catch (err: any) {
      console.error('Error scanning website:', err);
      setError(err.message || 'An error occurred while scanning your website');
    } finally {
      setIsScanning(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    // Reset state
    setScanResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="text-brand-600" size={20} />
              Scan Website Compliance
            </CardTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!scanResult ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="yoursite.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isScanning) {
                        handleScan();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    disabled={isScanning}
                  />
                  <Button
                    onClick={handleScan}
                    disabled={isScanning || !websiteUrl.trim()}
                    className="px-6"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  We'll check for missing legal pages like Privacy Policy, Terms of Service, and more.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {isScanning && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">Scanning your website...</p>
                  <p className="text-xs text-slate-600 mt-1">
                    This may take a minute. We're checking for legal compliance issues.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="text-brand-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-slate-900">Scan Complete</p>
                  <p className="text-sm text-slate-700 mt-1">{scanResult.summary}</p>
                </div>
              </div>

              {/* Found Documents Section */}
              {scanResult.foundDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="text-green-600" size={16} />
                    Found Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {scanResult.foundDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-green-50/50 border border-green-100">
                        <CheckCircle2 className="text-green-600 h-4 w-4" />
                        <span className="text-sm text-slate-700 font-medium">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResult.missingDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="text-orange-600" size={16} />
                    Missing Documents
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {scanResult.missingDocuments.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/50 border border-orange-100">
                        <AlertTriangle className="text-orange-500 h-4 w-4" />
                        <span className="text-sm text-slate-700 font-medium">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scanResult.issues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Issues Found</h3>
                  <div className="space-y-3">
                    {scanResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${issue.severity === 'high'
                          ? 'bg-red-50 border-red-200'
                          : issue.severity === 'medium'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900">{issue.document}</p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${issue.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : issue.severity === 'medium'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{issue.issue}</p>
                        <p className="text-xs text-slate-600 mt-2 italic">{issue.whyItMatters}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResult.missingDocuments.length === 0 && scanResult.issues.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Great news!</p>
                  <p className="text-xs text-slate-700 mt-1">
                    No major compliance issues were found on your website.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                >
                  Done
                </Button>
                <Button
                  onClick={() => {
                    setScanResult(null);
                    setError(null);
                  }}
                  variant="outline"
                >
                  Scan Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
