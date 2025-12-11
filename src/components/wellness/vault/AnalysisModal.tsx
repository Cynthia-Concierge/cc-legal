import React from 'react';
import { X, FileSearch, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../../wellness/ui/Button';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    analysis: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, title, analysis }) => {
    if (!isOpen) return null;

    // Simple formatter to make the analysis look better without a heavyweight markdown library
    const formatAnalysis = (text: string) => {
        return text.split('\n').map((line, index) => {
            // Headers (lines starting with # or ##)
            if (line.startsWith('## ') || line.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3">{line.replace(/#/g, '').trim()}</h3>;
            }
            if (line.startsWith('# ')) {
                return <h2 key={index} className="text-xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-100">{line.replace('# ', '').trim()}</h2>;
            }

            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return (
                    <div key={index} className="flex gap-2 ml-4 mb-2">
                        <span className="text-brand-500 mt-1.5">•</span>
                        <span className="text-slate-700">{line.replace(/^[-•]\s*/, '')}</span>
                    </div>
                );
            }

            // Bold sections (simple detection of **text**)
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={index} className="mb-3 text-slate-700 leading-relaxed">
                        {parts.map((part, i) => (
                            i % 2 === 1 ? <span key={i} className="font-semibold text-slate-900">{part}</span> : part
                        ))}
                    </p>
                );
            }

            // Empty lines
            if (!line.trim()) {
                return <div key={index} className="h-2"></div>;
            }

            // Regular paragraphs
            return <p key={index} className="mb-3 text-slate-700 leading-relaxed">{line}</p>;
        });
    };

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
                    <div className="prose prose-slate max-w-none">
                        {analysis ? (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                {formatAnalysis(analysis)}
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
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-end gap-3 transition-colors">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
