import { UserDocument } from '../../../types/wellness';

export interface ClassificationResult {
  category: UserDocument['category'];
  documentType?: string; // Template ID if we can identify it
  confidence: 'high' | 'medium' | 'low'; // How confident we are in the classification
}

/**
 * Auto-classify a document based on its filename
 * Returns category, document type (if identifiable), and confidence level
 */
export function classifyDocument(fileName: string, fileContent?: string): ClassificationResult {
  const nameLower = fileName.toLowerCase();
  
  // High confidence matches - very specific keywords
  if (nameLower.includes('waiver') || nameLower.includes('release of liability')) {
    return { category: 'contract', documentType: 'template-1', confidence: 'high' };
  }
  
  if (nameLower.includes('intake') || nameLower.includes('client form') || nameLower.includes('registration form')) {
    return { category: 'contract', documentType: 'template-intake', confidence: 'high' };
  }
  
  if (nameLower.includes('privacy policy') || (nameLower.includes('privacy') && nameLower.includes('policy'))) {
    return { category: 'contract', documentType: 'template-privacy', confidence: 'high' };
  }
  
  if (nameLower.includes('refund') || nameLower.includes('cancellation policy')) {
    return { category: 'contract', documentType: 'template-refund', confidence: 'high' };
  }
  
  if (nameLower.includes('photo release') || nameLower.includes('video release') || nameLower.includes('media release')) {
    return { category: 'contract', documentType: 'template-4', confidence: 'high' };
  }
  
  if (nameLower.includes('social media disclaimer') || (nameLower.includes('social') && nameLower.includes('disclaimer'))) {
    return { category: 'contract', documentType: 'template-6', confidence: 'high' };
  }
  
  if (nameLower.includes('testimonial') || nameLower.includes('testimonial consent')) {
    return { category: 'contract', documentType: 'template-5', confidence: 'high' };
  }
  
  if (nameLower.includes('insurance') || nameLower.includes('certificate of insurance')) {
    return { category: 'insurance', documentType: 'insurance', confidence: 'high' };
  }
  
  if (nameLower.includes('trademark') || nameLower.includes('trademark application')) {
    return { category: 'formation', documentType: 'template-10', confidence: 'high' };
  }
  
  if (nameLower.includes('contractor agreement') || nameLower.includes('independent contractor')) {
    return { category: 'contract', documentType: 'template-7', confidence: 'high' };
  }
  
  if (nameLower.includes('employment agreement') || nameLower.includes('employee agreement')) {
    return { category: 'contract', documentType: 'template-8', confidence: 'high' };
  }
  
  // Medium confidence matches - less specific but still likely
  if (nameLower.includes('terms') || nameLower.includes('tos') || nameLower.includes('terms of service')) {
    return { category: 'contract', documentType: 'template-3', confidence: 'medium' };
  }
  
  if (nameLower.includes('studio policies') || nameLower.includes('studio policy')) {
    return { category: 'contract', documentType: 'template-studio', confidence: 'medium' };
  }
  
  if (nameLower.includes('membership agreement') || nameLower.includes('membership contract')) {
    return { category: 'contract', documentType: 'template-membership', confidence: 'medium' };
  }
  
  if (nameLower.includes('retreat waiver') || nameLower.includes('retreat liability')) {
    return { category: 'contract', documentType: 'template-retreat-waiver', confidence: 'medium' };
  }
  
  // Low confidence - generic terms that could be anything
  if (nameLower.includes('agreement') || nameLower.includes('contract')) {
    return { category: 'contract', confidence: 'low' };
  }
  
  // Default - we have no idea
  return { category: 'other', confidence: 'low' };
}

/**
 * Group documents by type and return best version first
 */
export function groupDocumentsByType(documents: UserDocument[]): Record<string, UserDocument[]> {
  const groups: Record<string, UserDocument[]> = {};
  
  documents.forEach(doc => {
    // Determine document type from title/category
    const titleLower = doc.title.toLowerCase();
    let type = 'Other Documents';
    
    if (titleLower.includes('waiver') || titleLower.includes('release')) {
      type = 'Waiver / Release';
    } else if (titleLower.includes('intake') || titleLower.includes('client form')) {
      type = 'Client Intake Form';
    } else if (titleLower.includes('terms') || titleLower.includes('tos')) {
      type = 'Terms of Service';
    } else if (titleLower.includes('privacy')) {
      type = 'Privacy Policy';
    } else if (titleLower.includes('refund') || titleLower.includes('cancellation')) {
      type = 'Refund / Cancellation Policy';
    } else if (titleLower.includes('photo') || titleLower.includes('video')) {
      type = 'Photo / Video Release';
    } else if (titleLower.includes('insurance')) {
      type = 'Insurance Certificates';
    } else if (titleLower.includes('trademark')) {
      type = 'Trademark Protection';
    } else if (titleLower.includes('contractor') || titleLower.includes('agreement')) {
      type = 'Contractor Agreements';
    }
    
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
  });
  
  // Sort each group: Generated > Uploaded > Old (by date)
  Object.keys(groups).forEach(type => {
    groups[type].sort((a, b) => {
      // Prioritize documents with analysis (analyzed = better)
      if (a.analysis && !b.analysis) return -1;
      if (!a.analysis && b.analysis) return 1;
      
      // Then by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });
  
  return groups;
}

