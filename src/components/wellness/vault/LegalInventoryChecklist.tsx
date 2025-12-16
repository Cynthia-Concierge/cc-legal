import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, FileText, ChevronDown, ChevronRight, ArrowRight, Shield, Eye, Trash2, Download } from 'lucide-react';
import { UserDocument, UserAnswers, DocumentItem } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';

export interface DocumentChecklistItem {
  id: string; // Template ID or custom ID
  label: string;
  category: 'core' | 'marketing' | 'advanced' | 'studio' | 'retreat' | 'website';
  templateId?: string; // Link to document template
}

type DocumentStatus = 'present' | 'needs-review' | 'missing';

interface LegalInventoryChecklistProps {
  documents: UserDocument[];
  userAnswers?: UserAnswers | null;
  onUploadClick?: () => void;
  onUploadWithType?: (documentType: string, documentLabel: string) => void;
  onViewDocument?: (document: UserDocument) => void;
  onViewAnalysis?: (document: UserDocument) => void;
  onDeleteDocument?: (document: UserDocument) => void;
  onDownloadDocument?: (document: UserDocument) => void;
  formatDate?: (dateString: string) => string;
}

// Map template IDs to checklist items
export const TEMPLATE_TO_CHECKLIST: Record<string, Omit<DocumentChecklistItem, 'id'>> = {
  'template-1': { label: 'Waiver / Release of Liability', category: 'core', templateId: 'template-1' },
  'template-retreat-waiver': { label: 'Retreat Liability Waiver', category: 'retreat', templateId: 'template-retreat-waiver' },
  'template-intake': { label: 'Client Intake Form', category: 'core', templateId: 'template-intake' },
  'template-website': { label: 'Website Terms & Conditions', category: 'website', templateId: 'template-website' },
  'template-privacy': { label: 'Privacy Policy', category: 'website', templateId: 'template-privacy' },
  'template-refund': { label: 'Refund / Cancellation Policy', category: 'website', templateId: 'template-refund' },
  'template-disclaimer': { label: 'Disclaimer', category: 'website', templateId: 'template-disclaimer' },
  'template-cookie': { label: 'Cookie Policy', category: 'website', templateId: 'template-cookie' },
  'template-4': { label: 'Photo / Video Release', category: 'marketing', templateId: 'template-4' },
  'template-6': { label: 'Social Media Disclaimer', category: 'marketing', templateId: 'template-6' },
  'template-5': { label: 'Testimonials Consent', category: 'marketing', templateId: 'template-5' },
  'template-10': { label: 'Trademark Protection', category: 'advanced', templateId: 'template-10' },
  'template-7': { label: 'Contractor Agreements', category: 'advanced', templateId: 'template-7' },
  'template-8': { label: 'Employment Agreement', category: 'advanced', templateId: 'template-8' },
  'template-2': { label: 'Service Agreement & Membership Contract', category: 'studio', templateId: 'template-2' },
  'template-studio': { label: 'Studio Policies', category: 'studio', templateId: 'template-studio' },
  'template-class': { label: 'Class Terms & Conditions', category: 'studio', templateId: 'template-class' },
  'template-membership': { label: 'Membership Agreement', category: 'studio', templateId: 'template-membership' },
  'template-travel': { label: 'Travel & Excursion Agreement', category: 'retreat', templateId: 'template-travel' },
};

// Insurance is not in templates but should be in checklist
const INSURANCE_CHECKLIST_ITEM: DocumentChecklistItem = {
  id: 'insurance',
  label: 'Insurance Certificates',
  category: 'advanced',
};

export const LegalInventoryChecklist: React.FC<LegalInventoryChecklistProps> = ({
  documents,
  userAnswers,
  onUploadClick,
  onUploadWithType,
  onViewDocument,
  onViewAnalysis,
  onDeleteDocument,
  onDownloadDocument,
  formatDate
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Get recommended documents based on user answers
  const recommendedDocs = useMemo(() => {
    if (!userAnswers) {
      // Fallback: show core documents if no answers
      return {
        freeTemplates: [],
        advancedTemplates: [],
        topPriorities: []
      };
    }
    return getRecommendedDocuments(userAnswers);
  }, [userAnswers]);

  // Build checklist from recommended documents
  const checklistItems = useMemo((): DocumentChecklistItem[] => {
    const items: DocumentChecklistItem[] = [];
    const addedTemplateIds = new Set<string>();

    // Add all recommended documents (free + advanced)
    const allRecommended = [...recommendedDocs.freeTemplates, ...recommendedDocs.advancedTemplates];

    allRecommended.forEach(doc => {
      const checklistMapping = TEMPLATE_TO_CHECKLIST[doc.id];
      if (checklistMapping && !addedTemplateIds.has(doc.id)) {
        items.push({
          id: doc.id,
          ...checklistMapping
        });
        addedTemplateIds.add(doc.id);
      }
    });

    // Always include insurance (it's not a template but should be tracked)
    items.push(INSURANCE_CHECKLIST_ITEM);

    return items;
  }, [recommendedDocs]);

  // Helper function to check if a document matches a checklist item
  const documentMatchesItem = (doc: UserDocument, item: DocumentChecklistItem): boolean => {
    // PRIORITY 1: Match by stored document_type (most accurate - exact match required)
    // If document_type is set, we ONLY match by document_type - never by keywords
    // This prevents false positives
    if (doc.document_type) {
      // Exact match with template ID
      if (item.templateId && doc.document_type === item.templateId) {
        return true;
      }
      // Exact match with item ID (for insurance, etc.)
      if (doc.document_type === item.id) {
        return true;
      }
      // If document has a document_type but it doesn't match, don't match this document
      // This prevents false positives from keyword matching
      // CRITICAL: Documents with document_type set should NEVER match via keywords
      return false;
    }

    // PRIORITY 2: Only if document_type is NOT set, try keyword matching as fallback
    // This is less accurate but helps with old documents that don't have document_type
    // NOTE: This is a fallback - ideally all documents should have document_type set
    const titleLower = doc.title.toLowerCase();
    const categoryLower = doc.category?.toLowerCase() || '';

    // Specific, strict keyword matching for each document type
    // We use very specific patterns to avoid false positives
    if (item.templateId === 'template-1' || item.id === 'template-1') {
      // Basic Waiver - must have waiver/release but NOT retreat
      // Also exclude if it has "retreat" anywhere
      return (titleLower.includes('waiver') || titleLower.includes('release')) &&
        !titleLower.includes('retreat') &&
        !titleLower.includes('travel');
    }

    if (item.templateId === 'template-retreat-waiver') {
      // Retreat Waiver - must have BOTH retreat AND waiver
      return titleLower.includes('retreat') && titleLower.includes('waiver');
    }

    if (item.templateId === 'template-intake') {
      // Client Intake Form
      return titleLower.includes('intake') ||
        (titleLower.includes('client') && titleLower.includes('form'));
    }

    if (item.templateId === 'template-website') {
      // Terms & Conditions - must have terms/conditions but NOT privacy
      return (titleLower.includes('terms') || titleLower.includes('tos') || titleLower.includes('conditions')) &&
        !titleLower.includes('privacy');
    }

    if (item.templateId === 'template-privacy') {
      // Privacy Policy - must have privacy
      return titleLower.includes('privacy');
    }

    if (item.templateId === 'template-refund') {
      // Refund Policy - must have refund or cancellation
      return titleLower.includes('refund') || titleLower.includes('cancellation');
    }

    if (item.templateId === 'template-4') {
      // Photo/Video Release - must have photo/video AND release
      return (titleLower.includes('photo') || titleLower.includes('video')) &&
        titleLower.includes('release');
    }

    if (item.templateId === 'template-6') {
      // Social Media Disclaimer - must have social AND (media OR disclaimer)
      return titleLower.includes('social') &&
        (titleLower.includes('media') || titleLower.includes('disclaimer'));
    }

    if (item.templateId === 'template-5') {
      // Testimonials Consent - must have testimonial
      return titleLower.includes('testimonial');
    }

    if (item.templateId === 'template-10') {
      // Trademark Protection
      return titleLower.includes('trademark') || categoryLower === 'formation';
    }

    if (item.templateId === 'template-7') {
      // Contractor Agreement - must have contractor
      return titleLower.includes('contractor');
    }

    if (item.templateId === 'template-8') {
      // Employment Agreement - must have employment or employee
      return titleLower.includes('employment') || titleLower.includes('employee');
    }

    if (item.templateId === 'template-2') {
      // Service Agreement & Membership Contract
      return (titleLower.includes('service') && titleLower.includes('agreement')) ||
        (titleLower.includes('membership') && titleLower.includes('contract'));
    }

    if (item.templateId === 'template-studio') {
      // Studio Policies - must have studio AND policies
      return titleLower.includes('studio') && titleLower.includes('polic');
    }

    if (item.templateId === 'template-class') {
      // Class Terms & Conditions
      return titleLower.includes('class') &&
        (titleLower.includes('terms') || titleLower.includes('conditions'));
    }

    if (item.templateId === 'template-membership') {
      // Membership Agreement - must have membership AND agreement
      return titleLower.includes('membership') && titleLower.includes('agreement');
    }

    if (item.templateId === 'template-travel') {
      // Travel & Excursion Agreement
      return (titleLower.includes('travel') || titleLower.includes('excursion')) &&
        titleLower.includes('agreement');
    }

    if (item.id === 'insurance') {
      // Insurance Certificates
      return titleLower.includes('insurance') || categoryLower === 'insurance';
    }

    if (item.templateId === 'template-disclaimer') {
      // Disclaimer - must have disclaimer but NOT social
      return titleLower.includes('disclaimer') && !titleLower.includes('social');
    }

    if (item.templateId === 'template-cookie') {
      // Cookie Policy - must have cookie
      return titleLower.includes('cookie');
    }

    // No match found
    return false;
  };

  // Map document categories/titles to checklist items
  const getDocumentStatus = (item: DocumentChecklistItem): DocumentStatus => {
    const matchingDocs = documents.filter(doc => documentMatchesItem(doc, item));

    if (matchingDocs.length === 0) return 'missing';

    // Check if any document has analysis (needs review)
    const hasAnalysis = matchingDocs.some(doc => doc.analysis);
    if (hasAnalysis) {
      // Check if analysis indicates issues
      const hasIssues = matchingDocs.some(doc =>
        doc.analysis && (
          doc.analysis.toLowerCase().includes('missing') ||
          doc.analysis.toLowerCase().includes('risk') ||
          doc.analysis.toLowerCase().includes('gap')
        )
      );
      return hasIssues ? 'needs-review' : 'present';
    }

    return 'needs-review'; // Uploaded but not analyzed
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'needs-review':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'needs-review':
        return 'Needs Review';
      case 'missing':
        return 'Missing';
    }
  };

  // Handle status click
  const handleStatusClick = (item: DocumentChecklistItem, status: DocumentStatus) => {
    if (status === 'missing') {
      // Missing - trigger upload with document type pre-selected
      const documentType = item.templateId || item.id;
      if (onUploadWithType && documentType) {
        onUploadWithType(documentType, item.label);
      } else if (onUploadClick) {
        onUploadClick();
      }
    } else {
      // Present or Needs Review - toggle accordion or show document
      const matchingDocs = documents.filter(doc => documentMatchesItem(doc, item));

      if (matchingDocs.length > 0) {
        const doc = matchingDocs[0];
        // If document has analysis, toggle accordion
        if (doc.analysis) {
          const newExpanded = new Set(expandedItems);
          if (newExpanded.has(item.id)) {
            newExpanded.delete(item.id);
          } else {
            newExpanded.add(item.id);
          }
          setExpandedItems(newExpanded);
        } else if (onViewDocument) {
          // No analysis, just view document
          onViewDocument(doc);
        }
      }
    }
  };

  // Toggle accordion
  const toggleAccordion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Get matching documents for an item (can have multiple versions)
  const getMatchingDocuments = (item: DocumentChecklistItem): UserDocument[] => {
    return documents.filter(doc => documentMatchesItem(doc, item));
  };

  // Parse issues from analysis text
  const parseIssues = (analysis: string) => {
    const issues: Array<{
      issue: string;
      severity: 'high' | 'medium' | 'low';
      whyItMatters?: string;
      recommendation?: string;
    }> = [];

    // Try to find structured sections first
    const lines = analysis.split('\n');
    let currentIssue: any = null;
    let currentSection: 'issue' | 'why' | 'recommendation' = 'issue';
    let issueBuffer: string[] = [];
    let whyBuffer: string[] = [];
    let recommendationBuffer: string[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Detect severity tags at start of line
      const highMatch = /\[HIGH\]|\[CRITICAL\]|🚩/i.test(trimmed);
      const mediumMatch = /\[MEDIUM\]/i.test(trimmed);
      const lowMatch = /\[LOW\]/i.test(trimmed);

      if (highMatch || mediumMatch || lowMatch) {
        // Save previous issue
        if (currentIssue || issueBuffer.length > 0) {
          const issueText = issueBuffer.join(' ').trim();
          if (issueText) {
            issues.push({
              issue: issueText,
              severity: currentIssue?.severity || (highMatch ? 'high' : mediumMatch ? 'medium' : 'low'),
              whyItMatters: whyBuffer.join(' ').trim() || undefined,
              recommendation: recommendationBuffer.join(' ').trim() || undefined,
            });
          }
        }

        // Start new issue
        const severity = highMatch ? 'high' : mediumMatch ? 'medium' : 'low';
        const issueText = trimmed
          .replace(/\[HIGH\]|\[MEDIUM\]|\[LOW\]|\[CRITICAL\]|🚩|⚠️/gi, '')
          .replace(/^\*\*|\*\*$/g, '')
          .replace(/^[-•]\s*/, '')
          .trim();

        currentIssue = { severity };
        issueBuffer = issueText ? [issueText] : [];
        whyBuffer = [];
        recommendationBuffer = [];
        currentSection = 'issue';
        return;
      }

      // Detect section headers
      if (lower.includes("why this matters") || lower.includes("why it matters") ||
        lower.includes("matters because") || trimmed.includes('⚡')) {
        currentSection = 'why';
        return;
      }

      if (lower.includes("recommendation") || lower.includes("actionable") ||
        lower.includes("fix") || lower.includes("change") || trimmed.includes('💡') ||
        lower.includes('what to do')) {
        currentSection = 'recommendation';
        return;
      }

      // Add content to appropriate buffer
      if (trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('##')) {
        const cleanLine = trimmed
          .replace(/^\*\*|\*\*$/g, '')
          .replace(/^[-•]\s*/, '')
          .trim();

        if (cleanLine.length > 0) {
          if (currentSection === 'why') {
            whyBuffer.push(cleanLine);
          } else if (currentSection === 'recommendation') {
            recommendationBuffer.push(cleanLine);
          } else {
            issueBuffer.push(cleanLine);
          }
        }
      }
    });

    // Save last issue
    if (currentIssue || issueBuffer.length > 0) {
      const issueText = issueBuffer.join(' ').trim();
      if (issueText) {
        issues.push({
          issue: issueText,
          severity: currentIssue?.severity || 'medium',
          whyItMatters: whyBuffer.join(' ').trim() || undefined,
          recommendation: recommendationBuffer.join(' ').trim() || undefined,
        });
      }
    }

    // If we found structured issues, return them
    if (issues.length > 0) {
      return issues;
    }

    // Fallback: try to extract from "Critical Red Flags" or "Potential Weaknesses" sections
    const redFlagsMatch = analysis.match(/🚩\s*Critical\s+Red\s+Flags?[\s\S]*?(?=⚠️|💡|##|$)/i);
    const weaknessesMatch = analysis.match(/⚠️\s*Potential\s+Weaknesses?[\s\S]*?(?=💡|##|$)/i);

    if (redFlagsMatch || weaknessesMatch) {
      const redFlagsText = redFlagsMatch?.[0] || '';
      const weaknessesText = weaknessesMatch?.[0] || '';

      // Extract bullet points
      const extractBullets = (text: string, severity: 'high' | 'medium') => {
        const bullets = text.split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map(line => line.replace(/^[-•]\s*/, '').trim())
          .filter(line => line.length > 0);

        return bullets.map(bullet => ({
          issue: bullet,
          severity,
        }));
      };

      const highIssues = extractBullets(redFlagsText, 'high');
      const mediumIssues = extractBullets(weaknessesText, 'medium');

      return [...highIssues, ...mediumIssues];
    }

    return [];
  };

  // Reusable component for document item with accordion
  const DocumentItemWithAccordion: React.FC<{
    item: DocumentChecklistItem;
    status: DocumentStatus;
    isExpanded: boolean;
    matchingDocs: UserDocument[];
    onStatusClick: () => void;
    onToggleAccordion: () => void;
  }> = ({ item, status, isExpanded, matchingDocs, onStatusClick, onToggleAccordion }) => {
    const primaryDoc = matchingDocs[0] || null; // Best version (already sorted)
    const hasAnalysis = primaryDoc?.analysis;
    const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

    const toggleIssue = (idx: number) => {
      const newExpanded = new Set(expandedIssues);
      if (newExpanded.has(idx)) {
        newExpanded.delete(idx);
      } else {
        newExpanded.add(idx);
      }
      setExpandedIssues(newExpanded);
    };

    const getSeverityBadge = (severity: string) => {
      const severityLower = severity.toLowerCase();
      if (severityLower === 'high' || severityLower.includes('high')) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">HIGH</span>;
      }
      if (severityLower === 'medium' || severityLower.includes('medium')) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">MEDIUM</span>;
      }
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
    };

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
          {getStatusIcon(status)}
          <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onStatusClick}
              className={`text-xs font-medium cursor-pointer hover:underline transition-all ${status === 'present' ? 'text-green-600 hover:text-green-700' :
                status === 'needs-review' ? 'text-amber-600 hover:text-amber-700' :
                  'text-slate-400 hover:text-slate-600'
                }`}
            >
              {getStatusText(status)}
            </button>
            {(hasAnalysis || matchingDocs.length > 0) && (
              <button
                onClick={onToggleAccordion}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title={hasAnalysis ? "View analysis" : "View document"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Accordion Content */}
        {isExpanded && (
          <div className="border-t border-slate-200 bg-white p-5 space-y-4">
            {/* Show uploaded document(s) if present */}
            {matchingDocs.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Saved Document{matchingDocs.length > 1 ? 's' : ''}</div>
                {matchingDocs.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{doc.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDate ? formatDate(doc.created_at) : new Date(doc.created_at).toLocaleDateString()} • {doc.file_type?.toUpperCase() || 'File'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
                        {doc.analysis && onViewAnalysis && (
                          <button
                            onClick={() => onViewAnalysis(doc)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                            title="View Analysis"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                        {onViewDocument && (
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-all"
                            title="View Document"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {onDownloadDocument && (
                          <button
                            onClick={() => onDownloadDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {onDeleteDocument && (
                          <>
                            <div className="w-[1px] bg-slate-200 my-1"></div>
                            <button
                              onClick={() => onDeleteDocument(doc)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show analysis if available */}
            {hasAnalysis && primaryDoc && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">Analysis & Recommendations</h3>
                </div>

                {/* Parse and display issues */}
                {(() => {
                  const issues = parseIssues(primaryDoc.analysis);
                  const highIssues = issues.filter(i => i.severity === 'high').length;
                  const mediumIssues = issues.filter(i => i.severity === 'medium').length;

                  if (issues.length > 0) {
                    return (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="text-xs font-semibold text-slate-700 mb-2">ISSUES FOUND: {issues.length}</div>
                          <div className="flex items-center gap-4 text-xs">
                            {highIssues > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-slate-600">{highIssues} High Priority</span>
                              </div>
                            )}
                            {mediumIssues > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-slate-600">{mediumIssues} Medium Priority</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-3">
                          {issues.map((issue, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                              <div className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                  {getSeverityBadge(issue.severity)}
                                  <span className="flex-1 text-sm font-medium text-slate-900 leading-snug">
                                    {issue.issue}
                                  </span>
                                </div>

                                {/* Why This Matters - Collapsible */}
                                {issue.whyItMatters && (
                                  <div className="mt-3">
                                    <button
                                      onClick={() => toggleIssue(idx)}
                                      className="w-full flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-semibold text-amber-900">Why This Matters</span>
                                      </div>
                                      {expandedIssues.has(idx) ? (
                                        <ChevronDown className="w-4 h-4 text-amber-600 transition-transform" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-amber-600 transition-transform group-hover:translate-x-0.5" />
                                      )}
                                    </button>
                                    {expandedIssues.has(idx) && (
                                      <div className="mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{issue.whyItMatters}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Recommendation - Always visible */}
                                {issue.recommendation && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-2">
                                      <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="text-xs font-semibold text-blue-900 mb-1.5">What to Do:</div>
                                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{issue.recommendation}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action CTA */}
                        {highIssues > 0 && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-red-900 mb-1">
                                  {highIssues} High Priority Issue{highIssues > 1 ? 's' : ''} Found
                                </div>
                                <p className="text-xs text-slate-700">
                                  Consider reviewing these with a lawyer to ensure your document is fully protected.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Fallback to formatted sections if no issues parsed
                  return (
                    <div className="prose prose-sm max-w-none">
                      {formatAnalysis(primaryDoc.analysis).map((section, idx) => {
                        if (section.type === 'covered') {
                          return (
                            <div key={idx} className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <h4 className="text-sm font-semibold text-green-900">What's Covered</h4>
                              </div>
                              <div className="text-xs text-slate-700 whitespace-pre-wrap">{section.content.trim()}</div>
                            </div>
                          );
                        }
                        if (section.type === 'missing') {
                          return (
                            <div key={idx} className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <h4 className="text-sm font-semibold text-red-900">What's Missing</h4>
                              </div>
                              <div className="text-xs text-slate-700 whitespace-pre-wrap">{section.content.trim()}</div>
                            </div>
                          );
                        }
                        if (section.type === 'recommendations') {
                          return (
                            <div key={idx} className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <h4 className="text-sm font-semibold text-blue-900">Recommended Changes</h4>
                              </div>
                              <div className="text-xs text-slate-700 whitespace-pre-wrap">{section.content.trim()}</div>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className="text-xs text-slate-600 whitespace-pre-wrap mb-2">
                            {section.content.trim()}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Format analysis for display
  const formatAnalysis = (analysis: string) => {
    // Try to parse structured sections from the analysis
    const lines = analysis.split('\n');
    const sections: { type: 'covered' | 'missing' | 'why' | 'recommendations' | 'text'; content: string }[] = [];
    let currentSection: { type: 'covered' | 'missing' | 'why' | 'recommendations' | 'text'; content: string } | null = null;

    lines.forEach((line) => {
      const lineLower = line.toLowerCase().trim();
      const trimmedLine = line.trim();
      const isHeader = trimmedLine.startsWith('##') || trimmedLine.startsWith('###');

      // Detect section headers - check for emojis and keywords
      if (isHeader || lineLower.includes("what's covered") || lineLower.includes('✅ strengths') ||
        (lineLower.includes('strengths') && !lineLower.includes('weaknesses')) ||
        trimmedLine.includes('✅')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'covered', content: '' };
        // Don't add the header line itself
        return;
      }

      if (isHeader || lineLower.includes("what's missing") || lineLower.includes('🚩 red flags') ||
        lineLower.includes('critical red flags') || lineLower.includes('⚠️ potential weaknesses') ||
        (lineLower.includes('weaknesses') && !lineLower.includes('strengths')) ||
        trimmedLine.includes('🚩') || trimmedLine.includes('⚠️')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'missing', content: '' };
        return;
      }

      if (isHeader || lineLower.includes("why this matters") || lineLower.includes('why it matters') ||
        lineLower.includes('matters because') || lineLower.includes('⚡ why this matters') ||
        trimmedLine.includes('⚡')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'why', content: '' };
        return;
      }

      if (isHeader || lineLower.includes('💡 actionable recommendations') ||
        lineLower.includes('recommendations') || lineLower.includes('actionable') ||
        lineLower.includes('changes') || lineLower.includes('fix') ||
        trimmedLine.includes('💡')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'recommendations', content: '' };
        return;
      }

      // Add content to current section or create text section
      if (currentSection) {
        // Skip markdown headers but keep content
        if (!trimmedLine.startsWith('#') && trimmedLine.length > 0) {
          // Clean up markdown formatting
          let cleanLine = line;
          // Remove bold markers but keep text
          cleanLine = cleanLine.replace(/\*\*/g, '');
          // Remove list markers but keep indentation
          if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('• ')) {
            cleanLine = cleanLine.replace(/^(\s*)[-•]\s+/, '$1');
          }
          currentSection.content += cleanLine + '\n';
        }
      } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
        // Only add non-empty, non-header lines to text sections
        if (sections.length === 0 || sections[sections.length - 1].type !== 'text') {
          sections.push({ type: 'text', content: line + '\n' });
        } else {
          sections[sections.length - 1].content += line + '\n';
        }
      }
    });

    if (currentSection) sections.push(currentSection);

    // If no structured sections found, return as text
    if (sections.length === 0 || (sections.length === 1 && sections[0].type === 'text' && sections[0].content.trim().length === 0)) {
      return [{ type: 'text' as const, content: analysis }];
    }

    // Clean up sections - remove empty ones
    return sections.filter(s => s.content.trim().length > 0);
  };

  // Group items by category
  const coreDocs = checklistItems.filter(item => item.category === 'core');
  const websiteDocs = checklistItems.filter(item => item.category === 'website');
  const marketingDocs = checklistItems.filter(item => item.category === 'marketing');
  const studioDocs = checklistItems.filter(item => item.category === 'studio');
  const retreatDocs = checklistItems.filter(item => item.category === 'retreat');
  const advancedDocs = checklistItems.filter(item => item.category === 'advanced');

  const presentCount = checklistItems.filter(item =>
    getDocumentStatus(item) === 'present'
  ).length;
  const totalCount = checklistItems.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900">Your Documents</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {presentCount} / {totalCount}
            </div>
            <div className="text-xs text-slate-500">documents</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 ml-7">
          All the documents you need to protect your business. Start filling them in to build your legal protection.
        </p>
      </div>

      {/* Core Business Documents */}
      {coreDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Core Business Documents</h3>
          <div className="space-y-3">
            {coreDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Website Compliance */}
      {websiteDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Website Compliance</h3>
          <div className="space-y-3">
            {websiteDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Marketing & Media */}
      {marketingDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Marketing & Media</h3>
          <div className="space-y-3">
            {marketingDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Studio-Specific Documents */}
      {studioDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Studio-Specific Documents</h3>
          <div className="space-y-3">
            {studioDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Retreat-Specific Documents */}
      {retreatDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Retreat-Specific Documents</h3>
          <div className="space-y-3">
            {retreatDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced / Situational */}
      {advancedDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Advanced / Situational</h3>
          <div className="space-y-3">
            {advancedDocs.map(item => {
              const status = getDocumentStatus(item);
              const matchingDocs = getMatchingDocuments(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <DocumentItemWithAccordion
                  key={item.id}
                  item={item}
                  status={status}
                  isExpanded={isExpanded}
                  matchingDocs={matchingDocs}
                  onStatusClick={() => handleStatusClick(item, status)}
                  onToggleAccordion={() => toggleAccordion(item.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
