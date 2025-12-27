import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Download, Eye, Loader2 } from 'lucide-react';
import { UserDocument, UserAnswers } from '../../../types/wellness';
import { vaultService } from '../../../lib/wellness/vaultService';
import { Button } from '../../wellness/ui/Button';
import { DocumentViewerModal } from './DocumentViewerModal';
import { CopyableDocumentModal } from './CopyableDocumentModal';
import { LegalInventoryChecklist } from './LegalInventoryChecklist';
import { toast } from '../../../hooks/use-toast';

export const DocumentVault: React.FC = () => {
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);

    // Viewer State
    const [viewerDoc, setViewerDoc] = useState<UserDocument | null>(null);
    const [viewerContent, setViewerContent] = useState<string>('');

    // Delete confirmation state
    const [docToDelete, setDocToDelete] = useState<UserDocument | null>(null);

    // Copyable Document Modal state
    const [copyableDoc, setCopyableDoc] = useState<UserDocument | null>(null);
    const [copyableHtmlContent, setCopyableHtmlContent] = useState<string>('');
    const [isLoadingHtml, setIsLoadingHtml] = useState(false);

    // Fetch documents and user answers on mount
    useEffect(() => {
        fetchDocuments();
        loadUserAnswers();
    }, []);

    // Listen for document updates (e.g., after generation)
    useEffect(() => {
        const handleDocumentsUpdated = () => {
            // Small delay to ensure database has updated
            setTimeout(() => {
                fetchDocuments();
            }, 500);
        };

        window.addEventListener('documents-updated', handleDocumentsUpdated);
        return () => {
            window.removeEventListener('documents-updated', handleDocumentsUpdated);
        };
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

    // UPLOAD FUNCTIONALITY REMOVED
    // All documents are now auto-generated during onboarding
    // Users no longer need to upload their own documents

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

    const handleCopyAsText = async (doc: UserDocument) => {
        try {
            setIsLoadingHtml(true);
            setCopyableDoc(doc);

            // Get the download URL for the document
            const url = await vaultService.getDownloadUrl(doc.file_path);
            if (!url) {
                toast({
                    variant: "destructive",
                    title: "Could not load document",
                    description: "We couldn't generate a link for this file. Please try again.",
                });
                setIsLoadingHtml(false);
                setCopyableDoc(null);
                return;
            }

            // For PDFs, we can't extract HTML directly
            // We need to check if this is an HTML-generated document
            const isPdf = doc.file_type === 'pdf' || doc.file_path.endsWith('.pdf');

            if (isPdf) {
                // For PDF documents generated from HTML templates, we need to regenerate the HTML
                // Check if this document has a document_type that maps to a template
                if (doc.document_type && doc.document_type.startsWith('template-')) {
                    // Fetch the HTML version from the server
                    const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                    const response = await fetch(`${serverUrl}/api/documents/generate-html`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            templateName: getTemplateFileName(doc.document_type),
                        }),
                    });

                    if (response.ok) {
                        const html = await response.text();
                        setCopyableHtmlContent(html);
                    } else {
                        throw new Error('Failed to generate HTML version');
                    }
                } else {
                    toast({
                        variant: "destructive",
                        title: "Cannot copy this document",
                        description: "This document format doesn't support text copying. Please download the PDF instead.",
                    });
                    setIsLoadingHtml(false);
                    setCopyableDoc(null);
                    return;
                }
            } else {
                // For non-PDF documents, fetch the content directly
                const response = await fetch(url);
                const text = await response.text();
                setCopyableHtmlContent(text);
            }

            setIsLoadingHtml(false);
        } catch (error) {
            console.error('Failed to load document for copying:', error);
            toast({
                variant: "destructive",
                title: "Failed to load document",
                description: "Something went wrong while preparing the document. Please try again.",
            });
            setIsLoadingHtml(false);
            setCopyableDoc(null);
        }
    };

    // Helper function to map document_type to template file name
    const getTemplateFileName = (documentType: string): string => {
        const mapping: Record<string, string> = {
            'template-6': 'social_media_disclaimer',
            'template-4': 'media_release_form',
            'template-intake': 'client_intake_form',
            'template-1': 'waiver_release_of_liability',
            'template-2': 'service_agreement_membership_contract',
            'template-3': 'terms_privacy_disclaimer',
            'template-5': 'testimonial_consent_agreement',
            'template-7': 'independent_contractor_agreement',
            'template-8': 'employment_agreement',
            'template-9': 'influencer_collaboration_agreement',
            'template-10': 'trademark_ip_protection_guide',
            'template-membership': 'membership_agreement',
            'template-studio': 'studio_policies',
            'template-class': 'class_terms_conditions',
            'template-privacy': 'privacy_policy',
            'template-website': 'website_terms_conditions',
            'template-refund': 'refund_cancellation_policy',
            'template-disclaimer': 'website_disclaimer',
            'template-cookie': 'cookie_policy',
            'template-retreat-waiver': 'retreat_liability_waiver',
            'template-travel': 'travel_excursion_agreement',
        };
        return mapping[documentType] || documentType;
    };

    return (
        <>
            <div className="space-y-6">
                {/* Legal Inventory Checklist */}
                {!isLoading && (
                    <LegalInventoryChecklist
                        documents={documents}
                        userAnswers={userAnswers}
                        onViewDocument={handleViewDocument}
                        onDeleteDocument={handleDelete}
                        onDownloadDocument={async (doc) => {
                            const url = await vaultService.getDownloadUrl(doc.file_path);
                            if (url) window.open(url, '_blank');
                        }}
                        onCopyAsText={handleCopyAsText}
                        formatDate={formatDate}
                    />
                )}
            </div>

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

            <CopyableDocumentModal
                isOpen={!!copyableDoc && !isLoadingHtml}
                onClose={() => {
                    setCopyableDoc(null);
                    setCopyableHtmlContent('');
                }}
                title={copyableDoc?.title || 'Copy Document Text'}
                htmlContent={copyableHtmlContent}
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

            {/* Upload modals removed - all documents are auto-generated */}
        </>
    );
};
