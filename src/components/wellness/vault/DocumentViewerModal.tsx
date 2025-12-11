import React from 'react';
import { X, Download, FileText, Printer } from 'lucide-react';
import { Button } from '../../wellness/ui/Button';

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    onDownload?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
    isOpen,
    onClose,
    title,
    content,
    onDownload
}) => {
    if (!isOpen) return null;

    // Simple markdown-like formatter
    const formatContent = (text: string) => {
        if (!text) return <p className="text-slate-400 italic">No content available.</p>;

        return text.split('\n').map((line, index) => {
            // Headers
            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200">{line.replace('# ', '')}</h1>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-bold text-slate-800 mt-5 mb-3">{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
            }

            // Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return (
                    <div key={index} className="flex gap-3 ml-4 mb-2">
                        <span className="text-slate-400 mt-1.5">•</span>
                        <span className="text-slate-700 leading-relaxed">{line.replace(/^[-•]\s*/, '')}</span>
                    </div>
                );
            }

            // Numbered lists (simple detection)
            if (/^\d+\.\s/.test(line.trim())) {
                return (
                    <div key={index} className="flex gap-3 ml-4 mb-2">
                        <span className="text-slate-400 font-medium mt-0.5 min-w-[1rem]">{line.match(/^\d+\./)?.[0]}</span>
                        <span className="text-slate-700 leading-relaxed">{line.replace(/^\d+\.\s/, '')}</span>
                    </div>
                );
            }

            // Empty lines
            if (!line.trim()) {
                return <div key={index} className="h-3"></div>;
            }

            // Regular paragraphs
            return <p key={index} className="mb-3 text-slate-700 leading-relaxed text-base">{line}</p>;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 text-left">
            <div className="bg-slate-100 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header / Toolbar */}
                <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500">Read-only view</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onDownload && (
                            <Button variant="outline" size="sm" onClick={onDownload} title="Download Original">
                                <Download size={16} className="mr-2" /> Download
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => window.print()} title="Print" className="hidden md:flex">
                            <Printer size={16} />
                        </Button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Clean Reader View */}
                <div className="flex-1 overflow-y-auto bg-white flex justify-center scroll-smooth">
                    <div className="w-full max-w-3xl p-8 md:p-12 pb-20">
                        <div className="prose prose-slate prose-headings:font-semibold prose-a:text-brand-600 max-w-none">
                            {formatContent(content)}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
