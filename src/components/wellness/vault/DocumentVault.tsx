import React, { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Eye, FileSearch, Loader2 } from 'lucide-react';
import { UserDocument, UserAnswers } from '../../../types/wellness';
import { vaultService } from '../../../lib/wellness/vaultService';
import { Button } from '../../wellness/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../wellness/ui/Card';
import { AnalysisModal } from './AnalysisModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { LegalInventoryChecklist } from './LegalInventoryChecklist';
import { classifyDocument } from './documentClassifier';
import { DocumentTypeSelectorModal } from './DocumentTypeSelectorModal';
import { ContractReviewModal } from '../../wellness/ContractReviewModal';
import { toast } from '../../../hooks/use-toast';

export const DocumentVault: React.FC = () => {
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [viewAnalysisDoc, setViewAnalysisDoc] = useState<UserDocument | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);

    // Viewer State
    const [viewerDoc, setViewerDoc] = useState<UserDocument | null>(null);
    const [viewerContent, setViewerContent] = useState<string>('');

    // Delete confirmation state
    const [docToDelete, setDocToDelete] = useState<UserDocument | null>(null);

    // Document type selection state
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    
    // Contract Review Modal state (for "Missing" clicks)
    const [showContractReview, setShowContractReview] = useState(false);
    const [preSelectedDocType, setPreSelectedDocType] = useState<string | undefined>();
    const [preSelectedDocLabel, setPreSelectedDocLabel] = useState<string | undefined>();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch documents and user answers on mount
    useEffect(() => {
        fetchDocuments();
        loadUserAnswers();
    }, []);

    const loadUserAnswers = () => {
        try {
            const saved = localStorage.getItem('wellness_onboarding_answers');
            if (saved) {
                const parsed = JSON.parse(saved);
                setUserAnswers(parsed);
            }
        } catch (error) {
            console.error('Failed to load user answers', error);
        }
    };

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
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload a file smaller than 10MB.",
            });
            return;
        }

        // Try to auto-classify
        const classification = classifyDocument(file.name);
        
        // If confidence is low or we couldn't identify the document type, ask user
        if (classification.confidence === 'low' || !classification.documentType) {
            setPendingFile(file);
            setShowTypeSelector(true);
            // Reset input so they can select the same file again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // High/medium confidence - proceed with upload
        await uploadDocumentWithType(file, classification.category, classification.documentType);
    };

    const uploadDocumentWithType = async (
        file: File,
        category: UserDocument['category'],
        documentType?: string
    ) => {
        setIsUploading(true);
        try {
            const newDoc = await vaultService.uploadDocument(file, category, undefined, undefined, undefined, documentType);
            if (newDoc) {
                setDocuments(prev => [newDoc, ...prev]);
                toast({
                    title: "Document uploaded",
                    description: `"${newDoc.title}" has been added. We'll analyze it for gaps and risks.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Upload failed",
                    description: "We couldn't upload that document. Please try again.",
                });
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: "Something went wrong while uploading. Please try again.",
            });
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDocumentTypeSelected = async (documentType: string | null) => {
        setShowTypeSelector(false);
        
        if (!pendingFile) return;

        // Determine category from document type
        let category: UserDocument['category'] = 'other';
        if (documentType === 'insurance') {
            category = 'insurance';
        } else if (documentType?.startsWith('template-')) {
            category = 'contract'; // Most templates are contracts
        }

        await uploadDocumentWithType(pendingFile, category, documentType || undefined);
        setPendingFile(null);
    };

    const handleDocumentTypeCancel = () => {
        setShowTypeSelector(false);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle upload with pre-selected document type (from checklist click)
    const handleUploadWithType = (documentType: string, documentLabel: string) => {
        // Show Contract Review Modal instead of file picker
        setPreSelectedDocType(documentType);
        setPreSelectedDocLabel(documentLabel);
        setShowContractReview(true);
    };

    // Handle when contract review completes - refresh documents
    const handleContractReviewComplete = () => {
        fetchDocuments(); // Refresh the document list
    };

    // Updated file upload handler to check for pre-selected type
    const handleFileUploadWithPreSelectedType = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if we have a pre-selected document type
        const preSelectedType = (event.target as any).dataset.preSelectedType;
        const preSelectedLabel = (event.target as any).dataset.preSelectedLabel;

        // Clear the dataset
        delete (event.target as any).dataset.preSelectedType;
        delete (event.target as any).dataset.preSelectedLabel;

        // Simple validation
        if (file.size > 10 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload a file smaller than 10MB.",
            });
            return;
        }

        if (preSelectedType) {
            // We have a pre-selected type - upload directly with that type
            let category: UserDocument['category'] = 'other';
            if (preSelectedType === 'insurance') {
                category = 'insurance';
            } else if (preSelectedType.startsWith('template-')) {
                category = 'contract';
            }

            await uploadDocumentWithType(file, category, preSelectedType);
            toast({
                title: "Document uploaded",
                description: `"${file.name}" has been added as ${preSelectedLabel || 'your document'}.`,
            });
        } else {
            // No pre-selected type - use normal classification flow
            const classification = classifyDocument(file.name);
            
            // If confidence is low or we couldn't identify the document type, ask user
            if (classification.confidence === 'low' || !classification.documentType) {
                setPendingFile(file);
                setShowTypeSelector(true);
                // Reset input so they can select the same file again if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // High/medium confidence - proceed with upload
            await uploadDocumentWithType(file, classification.category, classification.documentType);
        }
    };

    const handleViewDocument = async (doc: UserDocument) => {
        try {
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                toast({
                    variant: "destructive",
                    title: "Could not open document",
                    description: "We couldn’t generate a secure link for this file. Please try again.",
                });
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

    const handleDelete = (doc: UserDocument) => {
        setDocToDelete(doc);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;

        const doc = docToDelete;
        const success = await vaultService.deleteDocument(doc.id, doc.file_path);
        if (success) {
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            toast({
                title: "Document deleted",
                description: `"${doc.title}" has been removed from your Vault.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: "We couldn’t delete that document. Please try again.",
            });
        }

        setDocToDelete(null);
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
            <div className="space-y-6">
                {/* Legal Inventory Checklist */}
                {!isLoading && (
                    <LegalInventoryChecklist 
                        documents={documents}
                        userAnswers={userAnswers}
                        onUploadClick={() => fileInputRef.current?.click()}
                        onUploadWithType={handleUploadWithType}
                        onViewDocument={handleViewDocument}
                        onViewAnalysis={(doc) => setViewAnalysisDoc(doc)}
                        onDeleteDocument={handleDelete}
                        onDownloadDocument={async (doc) => {
                            const url = await vaultService.getDownloadUrl(doc.file_path);
                            if (url) window.open(url, '_blank');
                        }}
                        formatDate={formatDate}
                    />
                )}
            </div>

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

            {/* Delete Confirmation Modal */}
            {docToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="bg-red-50 text-red-600 rounded-lg p-2">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Delete document?</h2>
                                <p className="text-sm text-slate-500">
                                    This will permanently remove <span className="font-medium text-slate-800">"{docToDelete.title}"</span> from your Vault.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDocToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 border-red-600"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Type Selector Modal */}
            <DocumentTypeSelectorModal
                isOpen={showTypeSelector}
                fileName={pendingFile?.name || ''}
                userAnswers={userAnswers}
                onSelect={handleDocumentTypeSelected}
                onCancel={handleDocumentTypeCancel}
            />

            {/* Contract Review Modal (for "Missing" document clicks) */}
            <ContractReviewModal
                isOpen={showContractReview}
                onClose={() => {
                    setShowContractReview(false);
                    setPreSelectedDocType(undefined);
                    setPreSelectedDocLabel(undefined);
                }}
                onComplete={handleContractReviewComplete}
                preSelectedDocumentType={preSelectedDocType}
                preSelectedDocumentLabel={preSelectedDocLabel}
            />
        </>
    );
};
