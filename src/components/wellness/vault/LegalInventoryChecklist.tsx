import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, XCircle, FileText, ChevronDown, ChevronRight, ArrowRight, Eye, Trash2, Download, Copy } from 'lucide-react';
import { UserDocument, UserAnswers, DocumentItem } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { getCompletedDocumentsCount } from '../../../lib/wellness/documentCountUtils';
import { supabase } from '../../../lib/supabase';
import { vaultService } from '../../../lib/wellness/vaultService';
import { toast } from 'sonner';

export interface DocumentChecklistItem {
  id: string; // Template ID or custom ID
  label: string;
  category: 'core' | 'marketing' | 'advanced' | 'studio' | 'retreat' | 'website' | 'employment';
  templateId?: string; // Link to document template
}

type DocumentStatus = 'present' | 'needs-review' | 'missing';

interface LegalInventoryChecklistProps {
  documents: UserDocument[];
  userAnswers?: UserAnswers | null;
  // Upload functionality removed - all documents are auto-generated
  onViewDocument?: (document: UserDocument) => void;
  // onViewAnalysis removed - no analysis shown for auto-generated documents
  onDeleteDocument?: (document: UserDocument) => void;
  onDownloadDocument?: (document: UserDocument) => void;
  onCopyAsText?: (document: UserDocument) => void;
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
  'template-7': { label: 'Contractor Agreements', category: 'employment', templateId: 'template-7' },
  'template-8': { label: 'Employment Agreement', category: 'employment', templateId: 'template-8' },
  'template-2': { label: 'Service Agreement & Membership Contract', category: 'studio', templateId: 'template-2' },
  'template-studio': { label: 'Studio Policies', category: 'studio', templateId: 'template-studio' },
  'template-class': { label: 'Class Terms & Conditions', category: 'studio', templateId: 'template-class' },
  'template-membership': { label: 'Membership Agreement', category: 'studio', templateId: 'template-membership' },
  'template-travel': { label: 'Travel & Excursion Agreement', category: 'retreat', templateId: 'template-travel' },
};

// Map template IDs to template file names for generation
const TEMPLATE_ID_TO_FILE_NAME: Record<string, string> = {
  // Original 3 free templates
  'template-6': 'social_media_disclaimer',
  'template-4': 'media_release_form',
  'template-intake': 'client_intake_form',

  // NEW: 15 advanced templates (now free with HTML generation)
  'template-1': 'waiver_release_of_liability',
  'template-2': 'service_agreement_membership_contract',
  'template-5': 'testimonial_consent_agreement',
  'template-7': 'independent_contractor_agreement',
  'template-8': 'employment_agreement',
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

// Free template IDs that can be generated (all 18 templates now free)
const FREE_TEMPLATE_IDS = new Set([
  'template-6', 'template-4', 'template-intake',
  'template-1', 'template-2', 'template-5',
  'template-7', 'template-8',
  'template-membership', 'template-studio', 'template-class',
  'template-privacy', 'template-website', 'template-refund',
  'template-disclaimer', 'template-cookie',
  'template-retreat-waiver', 'template-travel'
]);

interface MissingField {
  field: string;
  displayName: string;
  section: 'identity' | 'legal' | 'structure' | 'security';
}

function validateProfileFieldsForDocumentGeneration(
  userAnswers: UserAnswers | null | undefined,
  userEmail: string | null | undefined
): MissingField[] {
  const missing: MissingField[] = [];
  
  // Critical fields for document generation
  if (!userEmail || !userEmail.trim()) {
    missing.push({ field: 'email', displayName: 'email address', section: 'security' });
  }
  
  if (!userAnswers?.businessName || !userAnswers.businessName.trim()) {
    missing.push({ field: 'businessName', displayName: 'business name', section: 'identity' });
  }
  
  // Legal entity fields (important for legal documents)
  if (!userAnswers?.ownerName || !userAnswers.ownerName.trim()) {
    missing.push({ field: 'ownerName', displayName: 'owner/representative name', section: 'legal' });
  }
  
  if (!userAnswers?.businessAddress || !userAnswers.businessAddress.trim()) {
    missing.push({ field: 'businessAddress', displayName: 'business address', section: 'legal' });
  }
  
  // Business type is needed for document recommendations
  if (!userAnswers?.businessType || !userAnswers.businessType.trim()) {
    missing.push({ field: 'businessType', displayName: 'business type', section: 'structure' });
  }
  
  return missing;
}

export const LegalInventoryChecklist: React.FC<LegalInventoryChecklistProps> = ({
  documents,
  userAnswers,
  onViewDocument,
  onDeleteDocument,
  onDownloadDocument,
  onCopyAsText,
  formatDate
}) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [generatingDocs, setGeneratingDocs] = useState<Set<string>>(new Set());
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

  // Check if a website scan has been performed
  // DISABLED: Scan results no longer connected to document vault
  const hasWebsiteScanBeenPerformed = (): boolean => {
    return false;
  };

  // Check if document was found in website scan
  // DISABLED: Scan results no longer connected to document vault
  const checkWebsiteScanForDocument = (item: DocumentChecklistItem): boolean => {
    return false;
  };

  // Get issues for a specific document from website scan
  // DISABLED: No issues shown in vault - all documents are auto-generated
  const getDocumentIssues = (item: DocumentChecklistItem): Array<{
    document: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    whyItMatters: string;
  }> => {
    return [];
  };

  // Map document categories/titles to checklist items
  const getDocumentStatus = (item: DocumentChecklistItem): DocumentStatus => {
    const matchingDocs = documents.filter(doc => documentMatchesItem(doc, item));

    // If we have matching documents in vault, use that status
    if (matchingDocs.length > 0) {
      // Check if this is a personalized document (free template that was generated)
      // This includes documents generated during onboarding OR manually via "Personalize now"
      const templateId = item.templateId || item.id;
      const isPersonalizedFreeDoc = FREE_TEMPLATE_IDS.has(templateId) && 
        matchingDocs.some(doc => 
          (doc.title?.toLowerCase().includes('personalized')) ||
          (doc.description?.toLowerCase().includes('auto-generated')) ||
          (doc.description?.toLowerCase().includes('auto-generated during onboarding')) ||
          (doc.document_type === templateId && (doc.description?.toLowerCase().includes('auto-generated') || !doc.analysis))
        );

      // Personalized free documents are automatically "present" (completed)
      if (isPersonalizedFreeDoc) {
        return 'present';
      }

      // Check if this document was found on website (even if it's also in vault)
      const foundInScan = checkWebsiteScanForDocument(item);
      
      // If found on website, always count as "present" (completed) regardless of issues
      // This ensures documents found on website count towards the total
      if (foundInScan) {
        return 'present';
      }

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
    }

    // No matching documents in vault - check if found in website scan
    const foundInScan = checkWebsiteScanForDocument(item);
    if (foundInScan) {
      // Document was found on website - count it as "present" (completed)
      // Even if it has issues, it exists on their website and should count towards the total
      return 'present';
    }

    return 'missing';
  };

  const getStatusIcon = (status: DocumentStatus, item?: DocumentChecklistItem) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'needs-review':
        // If document was found in scan but not in vault, show a different icon
        if (item && !documents.some(doc => documentMatchesItem(doc, item))) {
          const foundInScan = checkWebsiteScanForDocument(item);
          if (foundInScan) {
            return <CheckCircle2 className="w-4 h-4 text-emerald-600" />; // Slightly different green for "found on website"
          }
        }
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: DocumentStatus, item?: DocumentChecklistItem) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'needs-review':
        // If document was found in scan but not in vault, show "Found on Website"
        if (item && !documents.some(doc => documentMatchesItem(doc, item))) {
          const foundInScan = checkWebsiteScanForDocument(item);
          if (foundInScan) {
            return 'Found on Website';
          }
        }
        return 'Needs Review';
      case 'missing':
        return 'Missing';
    }
  };

  // Handle generating a free document
  const handleGenerateFreeDocument = async (item: DocumentChecklistItem) => {
    const templateId = item.templateId || item.id;
    
    if (!FREE_TEMPLATE_IDS.has(templateId)) {
      // Not a free template, fall back to upload
      handleStatusClick(item, 'missing');
      return;
    }

    const templateFileName = TEMPLATE_ID_TO_FILE_NAME[templateId];
    if (!templateFileName) {
      console.error('No template file name found for:', templateId);
      return;
    }

    // Check if already generating
    if (generatingDocs.has(templateId)) {
      return;
    }

    try {
      setGeneratingDocs(prev => new Set(prev).add(templateId));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to generate documents');
        return;
      }

      // Get user email from auth
      const userEmail = user.email;

      // Validate specific fields
      const missingFields = validateProfileFieldsForDocumentGeneration(userAnswers, userEmail);
      
      if (missingFields.length > 0) {
        // Get the first missing field (most critical)
        const firstMissing = missingFields[0];
        
        // Create specific error message
        const message = `You're missing your ${firstMissing.displayName}. Complete your business profile to generate personalized documents.`;
        
        toast.info(message, {
          duration: 4000
        });
        
        // Navigate to the specific section
        navigate(`/wellness/dashboard/profile#${firstMissing.section}`);
        return;
      }

      // Call backend API to generate personalized document
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const apiUrl = `${serverUrl}/api/documents/generate`;
      
      console.log('[Document Generation] Calling API:', apiUrl);
      console.log('[Document Generation] Template:', templateFileName);
      console.log('[Document Generation] User ID:', user.id);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: templateFileName,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        // Try to get the actual error message from the response
        let errorMessage = `Failed to generate document: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error('[Document Generation] API Error:', errorData);
          } else {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.error('[Document Generation] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // If not a PDF, it's probably an error
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Server returned an error instead of a PDF');
        } catch (parseError) {
          throw new Error('Server did not return a valid PDF document');
        }
      }

      // Get the generated PDF blob
      const blob = await response.blob();
      const downloadFileName = `${templateFileName}-personalized-${Date.now()}.pdf`;
      const file = new File([blob], downloadFileName, { type: 'application/pdf' });

      // Save to vault
      await vaultService.uploadDocument(
        file,
        'contract',
        item.label + ' (Personalized)',
        'Auto-generated personalized document',
        undefined,
        templateId
      );

      toast.success('Document generated and saved to your vault!');
      
      // Trigger a custom event to refresh documents in parent component
      window.dispatchEvent(new CustomEvent('documents-updated'));
    } catch (error: any) {
      console.error('[Document Generation] Error:', error);
      console.error('[Document Generation] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // Provide user-friendly error message
      let userMessage = 'Failed to generate document. Please try again.';
      if (error?.message) {
        if (error.message.includes('fetch')) {
          userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('Server did not return')) {
          userMessage = 'The server returned an error. Please try again in a moment.';
        } else {
          userMessage = error.message;
        }
      }
      
      toast.error(userMessage, {
        duration: 5000
      });
    } finally {
      setGeneratingDocs(prev => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }
  };

  // Handle status click
  const handleStatusClick = (item: DocumentChecklistItem, status: DocumentStatus) => {
    if (status === 'missing') {
      // Check if this is a free template that can be generated
      const templateId = item.templateId || item.id;
      if (FREE_TEMPLATE_IDS.has(templateId)) {
        // Free template - generate instead of upload
        handleGenerateFreeDocument(item);
        return;
      }

      // Upload functionality removed - all documents are auto-generated
      // Missing documents should never occur since all are generated during onboarding
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
    // Analysis-related variables removed - documents are auto-generated and ready to use

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
          {getStatusIcon(status, item)}
          <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onStatusClick}
              disabled={generatingDocs.has(item.templateId || item.id)}
              className={`text-xs font-medium transition-all flex items-center gap-1 ${
                status === 'present' ? 'text-green-600 hover:text-green-700 hover:underline cursor-pointer' :
                status === 'needs-review' ? 'text-amber-600 hover:text-amber-700 hover:underline cursor-pointer' :
                generatingDocs.has(item.templateId || item.id) ? 'text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 cursor-not-allowed' :
                status === 'missing' && FREE_TEMPLATE_IDS.has(item.templateId || item.id) ?
                  'text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-4 py-2 rounded-full border-0 shadow-lg hover:shadow-xl group cursor-pointer animate-pulse' :
                  'text-slate-500 cursor-default'
              }`}
            >
              {status === 'missing' ? (
                FREE_TEMPLATE_IDS.has(item.templateId || item.id) ? (
                  <>
                    <span className="font-bold">
                      {generatingDocs.has(item.templateId || item.id) ? 'Generating...' : 'Personalize now'}
                    </span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </>
                ) : (
                  <span>Missing</span>
                )
              ) : (
                getStatusText(status, item)
              )}
            </button>

            {matchingDocs.length > 0 && (
              <button
                onClick={onToggleAccordion}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="View document"
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
            {/* Show saved document(s) */}
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
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {onCopyAsText && doc.document_type && doc.document_type.startsWith('template-') && (
                          <button
                            onClick={() => onCopyAsText(doc)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                            title="Copy as Text"
                          >
                            <Copy size={14} />
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

            {/* Analysis section removed - all documents are auto-generated and ready to use */}
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
  const employmentDocs = checklistItems.filter(item => item.category === 'employment');
  const advancedDocs = checklistItems.filter(item => item.category === 'advanced');

  // Use the shared utility function to ensure consistency with other widgets
  const { completed: presentCount, total: totalCount } = getCompletedDocumentsCount(documents, userAnswers);

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

      {/* Employment Agreements */}
      {employmentDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Employment Agreements</h3>
          <div className="space-y-3">
            {employmentDocs.map(item => {
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
