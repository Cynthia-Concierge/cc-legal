import React, { useMemo } from 'react';
import { X, FileSearch, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Zap, Phone } from 'lucide-react';
import { Button } from '../../wellness/ui/Button';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    analysis: string;
}

interface ParsedAnalysis {
    covered: string[];
    missing: string[];
    whyItMatters: string[];
    rawText: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, title, analysis }) => {
    if (!isOpen) return null;

    // Parse analysis into structured format
    const parsedAnalysis = useMemo((): ParsedAnalysis => {
        if (!analysis) {
            return { covered: [], missing: [], whyItMatters: [], rawText: '' };
        }

        const text = analysis.toLowerCase();
        const lines = analysis.split('\n');
        
        const covered: string[] = [];
        const missing: string[] = [];
        const whyItMatters: string[] = [];

        // Try to extract structured information
        let currentSection: 'covered' | 'missing' | 'why' | null = null;
        
        lines.forEach(line => {
            const lineLower = line.toLowerCase().trim();
            
            // Detect section headers
            if (lineLower.includes("what's covered") || lineLower.includes('covered') || lineLower.includes('includes')) {
                currentSection = 'covered';
                return;
            }
            if (lineLower.includes("what's missing") || lineLower.includes('missing') || lineLower.includes('no ') || lineLower.includes('lacks')) {
                currentSection = 'missing';
                return;
            }
            if (lineLower.includes("why this matters") || lineLower.includes('why it matters') || lineLower.includes('matters because')) {
                currentSection = 'why';
                return;
            }

            // Extract bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
                const content = line.replace(/^[-•*]\s*/, '').trim();
                if (content && currentSection) {
                    if (currentSection === 'covered') covered.push(content);
                    else if (currentSection === 'missing') missing.push(content);
                    else if (currentSection === 'why') whyItMatters.push(content);
                }
                return;
            }

            // Fallback: try to infer from content
            if (line.trim() && !line.startsWith('#') && !line.startsWith('##')) {
                if (lineLower.includes('includes') || lineLower.includes('has') || lineLower.includes('contains')) {
                    if (covered.length < 5) covered.push(line.trim());
                } else if (lineLower.includes('no ') || lineLower.includes('missing') || lineLower.includes('lacks') || lineLower.includes('does not')) {
                    if (missing.length < 5) missing.push(line.trim());
                } else if (lineLower.includes('matters') || lineLower.includes('important') || lineLower.includes('risk') || lineLower.includes('could')) {
                    if (whyItMatters.length < 5) whyItMatters.push(line.trim());
                }
            }
        });

        // If we couldn't parse structured data, show raw text
        if (covered.length === 0 && missing.length === 0 && whyItMatters.length === 0) {
            return { covered: [], missing: [], whyItMatters: [], rawText: analysis };
        }

        return { covered, missing, whyItMatters, rawText: '' };
    }, [analysis]);

    const hasGaps = parsedAnalysis.missing.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                            <FileSearch size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Contract Analysis</h2>
                            <p className="text-sm text-slate-500 max-w-sm truncate">{title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {parsedAnalysis.rawText ? (
                        // Fallback: show raw analysis if we couldn't parse it
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="prose prose-slate max-w-none">
                                {analysis.split('\n').map((line, index) => {
                                    if (line.startsWith('## ') || line.startsWith('### ')) {
                                        return <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3">{line.replace(/#/g, '').trim()}</h3>;
                                    }
                                    if (line.startsWith('# ')) {
                                        return <h2 key={index} className="text-xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-100">{line.replace('# ', '').trim()}</h2>;
                                    }
                                    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                                        return (
                                            <div key={index} className="flex gap-2 ml-4 mb-2">
                                                <span className="text-brand-500 mt-1.5">•</span>
                                                <span className="text-slate-700">{line.replace(/^[-•]\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    if (!line.trim()) {
                                        return <div key={index} className="h-2"></div>;
                                    }
                                    return <p key={index} className="mb-3 text-slate-700 leading-relaxed">{line}</p>;
                                })}
                            </div>
                        </div>
                    ) : parsedAnalysis.covered.length > 0 || parsedAnalysis.missing.length > 0 || parsedAnalysis.whyItMatters.length > 0 ? (
                        // Structured format
                        <div className="space-y-4">
                            {/* What's Covered */}
                            {parsedAnalysis.covered.length > 0 && (
                                <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">What's Covered</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {parsedAnalysis.covered.map((item, index) => (
                                            <li key={index} className="flex gap-2 text-slate-700">
                                                <span className="text-green-500 mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* What's Missing */}
                            {parsedAnalysis.missing.length > 0 && (
                                <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                            <XCircle size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">What's Missing</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {parsedAnalysis.missing.map((item, index) => (
                                            <li key={index} className="flex gap-2 text-slate-700">
                                                <span className="text-red-500 mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Why This Matters */}
                            {parsedAnalysis.whyItMatters.length > 0 && (
                                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                            <Zap size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Why This Matters</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {parsedAnalysis.whyItMatters.map((item, index) => (
                                            <li key={index} className="flex gap-2 text-slate-700">
                                                <span className="text-amber-500 mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertTriangle size={48} className="text-amber-400 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No Analysis Available</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">
                                This document hasn't been analyzed by our AI yet, or the analysis was not saved.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-between items-center gap-3 transition-colors">
                    {hasGaps && (
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                window.location.href = '/wellness/dashboard?action=book-call&reason=document-gaps';
                            }}
                            className="flex items-center gap-2"
                        >
                            <Phone className="w-4 h-4" />
                            Review with a Lawyer
                        </Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
