import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Globe, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

interface ScanResultSummary {
  websiteUrl?: string;
  timestamp?: string;
  foundDocuments: Array<{ name: string; url?: string }>;
  missingDocuments: string[];
  issues: Array<{
    document: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

interface WebsiteComplianceWidgetProps {
  hasScannedWebsite: boolean;
  scanResults: ScanResultSummary | null;
  onOpenScanModal: () => void;
}

export const WebsiteComplianceWidget: React.FC<WebsiteComplianceWidgetProps> = ({
  hasScannedWebsite,
  scanResults,
  onOpenScanModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const missingCount = scanResults?.missingDocuments?.length || 0;
  const foundCount = scanResults?.foundDocuments?.length || 0;
  const highIssues = scanResults?.issues?.filter((i) => i.severity === 'high') || [];
  const mediumIssues = scanResults?.issues?.filter((i) => i.severity === 'medium') || [];

  return (
    <Card className="border-none shadow-md overflow-hidden bg-white transition-all duration-300">
      <div
        className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-sm font-semibold">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">2</div>
            Website Legal Check
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasScannedWebsite && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Scanned
              </span>
            )}
            <ChevronDown
              className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              size={18}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1 pl-7">
          We’ll scan your website to see which legal pages are live, what’s missing, and whether anything needs updating.
        </p>
      </div>
      {isOpen && (
        <CardContent className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {!hasScannedWebsite || !scanResults ? (
            <>
              <p className="text-sm text-slate-600">
                We haven&apos;t scanned your website yet. Run a quick check to find missing policies and issues.
              </p>
              <Button
                size="sm"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                onClick={onOpenScanModal}
              >
                Scan Website for Gaps
              </Button>
            </>
          ) : (
            <>
              {/* Status row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {missingCount === 0 && highIssues.length === 0 && mediumIssues.length === 0 ? (
                    <>
                      <CheckCircle2 className="text-emerald-500" size={14} />
                      <span className="font-medium text-emerald-700">No critical issues detected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="text-amber-500" size={14} />
                      <span className="font-medium text-slate-700">
                        {missingCount > 0 ? `${missingCount} missing doc${missingCount > 1 ? 's' : ''}` : 'All core docs found'}
                        {highIssues.length + mediumIssues.length > 0
                          ? ` • ${highIssues.length + mediumIssues.length} issue${highIssues.length + mediumIssues.length > 1 ? 's' : ''} to review`
                          : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Found docs */}
              {foundCount > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Found documents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResults!.foundDocuments.slice(0, 5).map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {doc.name}
                      </span>
                    ))}
                    {foundCount > 5 && (
                      <span className="text-[11px] text-slate-400">+{foundCount - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Missing docs */}
              {missingCount > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Missing documents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResults!.missingDocuments.slice(0, 3).map((doc) => (
                      <span
                        key={doc}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-100"
                      >
                        {doc}
                      </span>
                    ))}
                    {missingCount > 3 && (
                      <span className="text-[11px] text-slate-400">+{missingCount - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Issues summary */}
              {(highIssues.length > 0 || mediumIssues.length > 0) && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Issues to fix</p>
                  <ul className="space-y-1">
                    {highIssues.slice(0, 2).map((issue, idx) => (
                      <li key={`high-${idx}`} className="text-[11px] text-red-700">
                        <span className="font-semibold">HIGH:</span> {issue.document} – {issue.issue}
                      </li>
                    ))}
                    {mediumIssues.slice(0, 1).map((issue, idx) => (
                      <li key={`med-${idx}`} className="text-[11px] text-orange-700">
                        <span className="font-semibold">MEDIUM:</span> {issue.document} – {issue.issue}
                      </li>
                    ))}
                    {highIssues.length + mediumIssues.length > 3 && (
                      <li className="text-[11px] text-slate-400">
                        +{highIssues.length + mediumIssues.length - 3} more issues in detailed report
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1 text-xs"
                onClick={onOpenScanModal}
              >
                View full scan details
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};


