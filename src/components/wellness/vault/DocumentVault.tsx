import React, { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Eye, FileSearch, Loader2 } from 'lucide-react';
import { UserDocument } from '../../../types/wellness';
import { vaultService } from '../../../lib/wellness/vaultService';
import { Button } from '../../wellness/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../wellness/ui/Card';
import { AnalysisModal } from './AnalysisModal';
import { DocumentViewerModal } from './DocumentViewerModal';

export const DocumentVault: React.FC = () => {
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [viewAnalysisDoc, setViewAnalysisDoc] = useState<UserDocument | null>(null);

    // Viewer State
    const [viewerDoc, setViewerDoc] = useState<UserDocument | null>(null);
    const [viewerContent, setViewerContent] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch documents on mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const docs = await vaultService.getUserDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB');
            return;
        }

        setIsUploading(true);
        try {
            // Default category 'other' for now, can be expanded
            const newDoc = await vaultService.uploadDocument(file, 'other');
            if (newDoc) {
                setDocuments(prev => [newDoc, ...prev]);
            } else {
                alert('Failed to upload document. Please try again.');
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleViewDocument = async (doc: UserDocument) => {
        try {
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                alert('Could not generate secure link.');
                return;
            }

            // Check if it's a text file we can display in-app
            const isTextFile = doc.file_type === 'txt' || doc.file_type === 'md' || doc.file_type === 'json' || doc.file_path.endsWith('.txt') || doc.file_path.endsWith('.md');

            if (isTextFile) {
                try {
                    // Fetch the content
                    const response = await fetch(url);
                    if (response.ok) {
                        const text = await response.text();
                        setViewerContent(text);
                        setViewerDoc(doc);
                        return;
                    }
                } catch (fetchErr) {
                    console.error('Failed to fetch text content:', fetchErr);
                    // Fall back to opening in new tab
                }
            }

            // Default: Open in new tab (browser will display PDF/Image)
            window.open(url, '_blank');

        } catch (error) {
            console.error('View failed', error);
        }
    };

    const handleDelete = async (doc: UserDocument) => {
        if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

        const success = await vaultService.deleteDocument(doc.id, doc.file_path);
        if (success) {
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        } else {
            alert('Failed to delete document.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-brand-100 p-1.5 rounded-lg text-brand-600">
                                <FileText size={20} />
                            </span>
                            Document Vault
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Securely store your signed contracts, insurance, and licenses.
                        </p>
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.jpg,.png"
                        />
                        <Button
                            size="sm"
                            variant="primary"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            Upload Document
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading documents...</div>
                    ) : documents.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50/50">
                            <Upload className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No documents uploaded yet.</p>
                            <p className="text-xs mt-1 opacity-70">Upload your signed waivers here to keep them safe.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {documents.map(doc => (
                                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                                                    {doc.title}
                                                </h4>
                                                {doc.analysis && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                                        Analyzed
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Added {formatDate(doc.created_at)} • {doc.file_type?.toUpperCase() || 'File'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {doc.analysis && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewAnalysisDoc(doc)}
                                                className="hidden sm:flex"
                                            >
                                                <FileSearch className="w-3.5 h-3.5 mr-1.5" />
                                                View Analysis
                                            </Button>
                                        )}

                                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                                            {doc.analysis && (
                                                <button
                                                    onClick={() => setViewAnalysisDoc(doc)}
                                                    className="sm:hidden p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                                                    title="View Analysis"
                                                >
                                                    <FileSearch size={16} />
                                                </button>
                                            )}

                                            {!doc.title.endsWith('(Scanned)') && (
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all"
                                                    title="View Original"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}

                                            <div className={`w-[1px] bg-slate-200 my-1 mx-0.5 ${doc.title.endsWith('(Scanned)') ? 'sm:hidden' : ''}`}></div>

                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AnalysisModal
                isOpen={!!viewAnalysisDoc}
                onClose={() => setViewAnalysisDoc(null)}
                title={viewAnalysisDoc?.title || ''}
                analysis={viewAnalysisDoc?.analysis || ''}
            />

            <DocumentViewerModal
                isOpen={!!viewerDoc}
                onClose={() => {
                    setViewerDoc(null);
                    setViewerContent('');
                }}
                title={viewerDoc?.title || 'Document Viewer'}
                content={viewerContent}
                onDownload={async () => {
                    if (viewerDoc) {
                        const url = await vaultService.getDownloadUrl(viewerDoc.file_path);
                        if (url) window.open(url, '_blank');
                    }
                }}
            />
        </>
    );
};
