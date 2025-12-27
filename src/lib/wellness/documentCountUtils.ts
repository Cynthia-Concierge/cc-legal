/**
 * Utility functions for calculating document completion counts
 * This ensures consistent counting across all widgets
 */

import { UserDocument, UserAnswers } from '../../../types/wellness';
import { getRecommendedDocuments } from './documentEngine';

export interface DocumentChecklistItem {
  id: string;
  label: string;
  category: 'core' | 'marketing' | 'advanced' | 'studio' | 'retreat' | 'website' | 'employment';
  templateId?: string;
}

type DocumentStatus = 'present' | 'needs-review' | 'missing';

// Free template IDs that can be personalized (all 18 templates now free)
const FREE_TEMPLATE_IDS = new Set([
  'template-6', 'template-4', 'template-intake',
  'template-1', 'template-2', 'template-5',
  'template-7', 'template-8',
  'template-membership', 'template-studio', 'template-class',
  'template-privacy', 'template-website', 'template-refund',
  'template-disclaimer', 'template-cookie',
  'template-retreat-waiver', 'template-travel'
]);

// Template to checklist mapping (must match LegalInventoryChecklist exactly)
const TEMPLATE_TO_CHECKLIST: Record<string, Omit<DocumentChecklistItem, 'id'>> = {
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

/**
 * Check if a document matches a checklist item
 */
function documentMatchesItem(doc: UserDocument, item: DocumentChecklistItem): boolean {
  const titleLower = (doc.title || '').toLowerCase();
  const categoryLower = (doc.document_type || '').toLowerCase();

  // Direct template ID match
  if (item.templateId && doc.document_type === item.templateId) {
    return true;
  }

  // Template-specific matching logic (simplified)
  const templateMatches: Record<string, (title: string, category: string) => boolean> = {
    'template-1': (t, c) => t.includes('waiver') || t.includes('release'),
    'template-2': (t, c) => (t.includes('service') && t.includes('agreement')) || (t.includes('membership') && t.includes('contract')),
    'template-3': (t, c) => t.includes('terms') && t.includes('privacy'),
    'template-4': (t, c) => t.includes('photo') && t.includes('release'),
    'template-5': (t, c) => t.includes('testimonial') || (t.includes('consent') && !t.includes('photo')),
    'template-6': (t, c) => t.includes('social') && t.includes('disclaimer'),
    'template-7': (t, c) => t.includes('contractor') || (t.includes('independent') && t.includes('agreement')),
    'template-8': (t, c) => t.includes('employment') && t.includes('agreement'),
    'template-9': (t, c) => t.includes('influencer') || (t.includes('collaboration') && t.includes('agreement')),
    'template-10': (t, c) => t.includes('trademark') || (t.includes('ip') && t.includes('protection')),
    'template-intake': (t, c) => t.includes('intake'),
    'template-website': (t, c) => t.includes('website') && (t.includes('terms') || t.includes('conditions')),
    'template-privacy': (t, c) => t.includes('privacy') && t.includes('policy'),
    'template-refund': (t, c) => t.includes('refund') || t.includes('cancellation'),
    'template-disclaimer': (t, c) => t.includes('disclaimer') && !t.includes('social'),
    'template-cookie': (t, c) => t.includes('cookie'),
    'template-studio': (t, c) => t.includes('studio') && t.includes('policies'),
    'template-class': (t, c) => t.includes('class') && t.includes('terms'),
    'template-membership': (t, c) => t.includes('membership') && t.includes('agreement'),
    'template-retreat-waiver': (t, c) => t.includes('retreat') && (t.includes('waiver') || t.includes('liability')),
    'template-travel': (t, c) => t.includes('travel') || (t.includes('excursion') && t.includes('agreement')),
  };

  if (item.templateId && templateMatches[item.templateId]) {
    return templateMatches[item.templateId](titleLower, categoryLower);
  }

  return false;
}

/**
 * Check if document was found in website scan
 */
function checkWebsiteScanForDocument(item: DocumentChecklistItem): boolean {
  try {
    const savedScan = localStorage.getItem('wellness_website_scan_result');
    if (!savedScan) return false;

    const scanResult = JSON.parse(savedScan);
    if (!scanResult?.foundDocuments || !Array.isArray(scanResult.foundDocuments)) return false;

    const itemNameMap: Record<string, string[]> = {
      'template-privacy': ['Privacy Policy', 'privacy policy', 'privacy'],
      'template-website': ['Terms of Service', 'Terms and Conditions', 'Website Terms', 'terms of service', 'terms and conditions'],
      'template-refund': ['Refund Policy', 'Cancellation Policy', 'Refund / Cancellation Policy', 'refund policy', 'cancellation policy'],
      'template-disclaimer': ['Disclaimer', 'disclaimer'],
      'template-cookie': ['Cookie Policy', 'cookie policy', 'cookies'],
    };

    const searchNames = itemNameMap[item.templateId || ''] || [item.label];
    
    return scanResult.foundDocuments.some((foundDoc: any) => {
      const foundName = (foundDoc.name || foundDoc).toLowerCase();
      return searchNames.some(searchName => 
        foundName.includes(searchName.toLowerCase()) || 
        searchName.toLowerCase().includes(foundName)
      );
    });
  } catch (e) {
    return false;
  }
}

/**
 * Get document status (same logic as LegalInventoryChecklist)
 */
function getDocumentStatus(
  item: DocumentChecklistItem,
  documents: UserDocument[]
): DocumentStatus {
  const matchingDocs = documents.filter(doc => documentMatchesItem(doc, item));

  if (matchingDocs.length > 0) {
    // Check if this is a personalized document
    const templateId = item.templateId || item.id;
    const isPersonalizedFreeDoc = FREE_TEMPLATE_IDS.has(templateId) && 
      matchingDocs.some(doc => 
        (doc.title?.toLowerCase().includes('personalized')) ||
        (doc.description?.toLowerCase().includes('auto-generated')) ||
        (doc.description?.toLowerCase().includes('auto-generated during onboarding')) ||
        (doc.document_type === templateId && (doc.description?.toLowerCase().includes('auto-generated') || !doc.analysis))
      );

    if (isPersonalizedFreeDoc) {
      return 'present';
    }

    // Check if found on website
    const foundInScan = checkWebsiteScanForDocument(item);
    if (foundInScan) {
      return 'present';
    }

    // Check if analyzed
    const hasAnalysis = matchingDocs.some(doc => doc.analysis);
    if (hasAnalysis) {
      const hasIssues = matchingDocs.some(doc =>
        doc.analysis && (
          doc.analysis.toLowerCase().includes('missing') ||
          doc.analysis.toLowerCase().includes('risk') ||
          doc.analysis.toLowerCase().includes('gap')
        )
      );
      return hasIssues ? 'needs-review' : 'present';
    }

    return 'needs-review';
  }

  // No matching documents - check if found in website scan
  const foundInScan = checkWebsiteScanForDocument(item);
  if (foundInScan) {
    return 'present';
  }

  return 'missing';
}

/**
 * Get checklist items based on user answers
 */
function getChecklistItems(userAnswers: UserAnswers | null): DocumentChecklistItem[] {
  if (!userAnswers) return [];

  const recommendedDocs = getRecommendedDocuments(userAnswers);
  const items: DocumentChecklistItem[] = [];
  const addedTemplateIds = new Set<string>();

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
}

/**
 * Calculate completed documents count
 * This uses the same logic as LegalInventoryChecklist to ensure consistency
 */
export function getCompletedDocumentsCount(
  documents: UserDocument[],
  userAnswers: UserAnswers | null
): { completed: number; total: number } {
  const checklistItems = getChecklistItems(userAnswers);
  
  const completed = checklistItems.filter(item =>
    getDocumentStatus(item, documents) === 'present'
  ).length;

  return {
    completed,
    total: checklistItems.length
  };
}

/**
 * Get list of completed documents with their labels
 * This includes documents in vault, found on website, and personalized documents
 */
export function getCompletedDocumentsList(
  documents: UserDocument[],
  userAnswers: UserAnswers | null
): Array<{ label: string; source: 'vault' | 'website' | 'personalized' }> {
  const checklistItems = getChecklistItems(userAnswers);
  const completedList: Array<{ label: string; source: 'vault' | 'website' | 'personalized' }> = [];

  checklistItems.forEach(item => {
    const status = getDocumentStatus(item, documents);
    
    if (status === 'present') {
      // Check if it's in the vault
      const matchingDocs = documents.filter(doc => documentMatchesItem(doc, item));
      
      if (matchingDocs.length > 0) {
        // Check if it's personalized
        const templateId = item.templateId || item.id;
        const isPersonalized = FREE_TEMPLATE_IDS.has(templateId) && 
          matchingDocs.some(doc => 
            (doc.title?.toLowerCase().includes('personalized')) ||
            (doc.description?.toLowerCase().includes('auto-generated')) ||
            (doc.description?.toLowerCase().includes('auto-generated during onboarding')) ||
            (doc.document_type === templateId && (doc.description?.toLowerCase().includes('auto-generated') || !doc.analysis))
          );
        
        if (isPersonalized) {
          completedList.push({ label: item.label, source: 'personalized' });
        } else {
          completedList.push({ label: item.label, source: 'vault' });
        }
      } else {
        // Not in vault, but found on website
        const foundInScan = checkWebsiteScanForDocument(item);
        if (foundInScan) {
          completedList.push({ label: item.label, source: 'website' });
        }
      }
    }
  });

  return completedList;
}
