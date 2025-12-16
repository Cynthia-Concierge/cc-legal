import { UserAnswers, DocumentItem, RecommendationResult } from '../../types/wellness';

// All templates - Basic (free) and Advanced (locked)
const ALL_TEMPLATES: DocumentItem[] = [
  // FREE BASIC TEMPLATES (3 templates)
  {
    id: 'template-6',
    title: 'Social Media Disclaimer',
    description: 'Protect your business from social media liability.',
    isLocked: false,
    category: 'free',
    pdfPath: '/pdfs/social_media_disclaimer.pdf'
  },
  {
    id: 'template-4',
    title: 'Photo Release Form',
    description: 'Permission to use client photos for marketing.',
    isLocked: false,
    category: 'free',
    pdfPath: '/pdfs/media_release_form.pdf'
  },
  {
    id: 'template-intake',
    title: 'Client Intake Form',
    description: 'Collect health history and emergency contacts.',
    isLocked: false,
    category: 'free',
    pdfPath: '/pdfs/client_intake_form.pdf'
  },

  // ADVANCED TEMPLATES (locked - require lawyer review)
  {
    id: 'template-1',
    title: 'Basic Waiver of Liability',
    description: 'Standard protection for physical activities.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/waiver_release_of_liability.pdf'
  },
  {
    id: 'template-2',
    title: 'Service Agreement & Membership Contract',
    description: 'Comprehensive agreement for services and membership terms.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/service_agreement_membership_contract.pdf'
  },
  {
    id: 'template-3',
    title: 'Terms & Conditions, Disclaimer',
    description: 'Website terms, privacy policy, and service disclaimers.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/terms_privacy_disclaimer.pdf'
  },
  {
    id: 'template-5',
    title: 'Testimonial Consent & Use Agreement',
    description: 'Legal permission to use client testimonials and reviews.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/testimonial_consent_agreement.pdf'
  },
  {
    id: 'template-7',
    title: 'Independent Contractor Agreement',
    description: 'Agreement for freelancers and independent contractors.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/independent_contractor_agreement.pdf'
  },
  {
    id: 'template-8',
    title: 'Employment Agreement',
    description: 'Comprehensive employment terms for full or part-time employees.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/employment_agreement.pdf'
  },
  {
    id: 'template-9',
    title: 'Influencer & Collaboration Agreement',
    description: 'Terms for influencer partnerships and collaborations.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/influencer_collaboration_agreement.pdf'
  },
  {
    id: 'template-10',
    title: 'Trademark & Intellectual Property (IP) Protection Guide',
    description: 'Guide to protecting your brand, trademarks, and intellectual property.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/trademark_ip_protection_guide.pdf'
  },
  {
    id: 'template-membership',
    title: 'Membership Agreement',
    description: 'Recurring billing terms and cancellation rules.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/membership_agreement.pdf'
  },
  {
    id: 'template-studio',
    title: 'Studio Policies',
    description: 'Rules of conduct for your facility.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/studio_policies.pdf'
  },
  {
    id: 'template-class',
    title: 'Class Terms & Conditions',
    description: 'Booking and attendance policies.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/class_terms_conditions.pdf'
  },
  {
    id: 'template-privacy',
    title: 'Privacy Policy',
    description: 'Legally required for data collection.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/privacy_policy.pdf'
  },
  {
    id: 'template-website',
    title: 'Website Terms & Conditions',
    description: 'Governs use of your website.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/website_terms_conditions.pdf'
  },
  {
    id: 'template-refund',
    title: 'Refund & Cancellation Policy',
    description: 'Clear rules for online purchases.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/refund_cancellation_policy.pdf'
  },
  {
    id: 'template-disclaimer',
    title: 'Website Disclaimer',
    description: 'Protect your business from content liability.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/website_disclaimer.pdf'
  },
  {
    id: 'template-cookie',
    title: 'Cookie Policy',
    description: 'Inform users about data collection cookies.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/cookie_policy.pdf'
  },
  // RETREAT SPECIALS
  {
    id: 'template-retreat-waiver',
    title: 'Retreat Liability Waiver',
    description: 'Essential specifically for multi-day retreats and travel.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/waiver_release_of_liability.pdf' // mapped to standard waiver for now
  },
  {
    id: 'template-travel',
    title: 'Travel & Excursion Agreement',
    description: 'For off-site excursions and international travel risks.',
    isLocked: true,
    category: 'advanced',
    pdfPath: '/pdfs/waiver_release_of_liability.pdf'
  }
];

export function getRecommendedDocuments(answers: UserAnswers): RecommendationResult {
  const freeDocs = ALL_TEMPLATES.filter(t => t.category === 'free');
  let advancedDocs: DocumentItem[] = [];

  // 1. Core Documents (Recommended for EVERYONE)
  const coreIds = [
    'template-1', // Waiver
    'template-website', // Website Terms
    'template-privacy', // Privacy Policy (Separate if needed, but template-3 seems to cover it)
    'template-disclaimer', // Disclaimer
    'template-cookie', // Cookie Policy
    'template-refund', // Refund Policy
    'template-10', // IP Protection (Good general advice)
  ];
  advancedDocs.push(...ALL_TEMPLATES.filter(t => coreIds.includes(t.id)));

  // 2. Dynamic Recommendations based on Answers

  // IF has Employees -> Employment Agreement
  if (answers.hasEmployees) {
    const doc = ALL_TEMPLATES.find(t => t.id === 'template-8'); // Employment Agreement
    if (doc) advancedDocs.push(doc);
  } else if (answers.hiresStaff) {
    // If they hire staff but not employees, they need Contractor Agreement
    const doc = ALL_TEMPLATES.find(t => t.id === 'template-7'); // Contractor Agreement
    if (doc) advancedDocs.push(doc);
  }

  // IF Studio Owner (has physical location implies studio policies)
  // Check both profile businessType and onboarding primaryBusinessType
  const isStudio = (answers.businessType && (answers.businessType.includes('Studio') || answers.businessType.includes('Gym'))) ||
    ['Yoga', 'Pilates', 'Gym'].includes(answers.primaryBusinessType || '');

  if (isStudio) {
    const studioDocs = ALL_TEMPLATES.filter(t => ['template-studio', 'template-class', 'template-membership', 'template-2'].includes(t.id));
    advancedDocs.push(...studioDocs);
  }

  // IF Hosts Retreats -> Recommend specific retreat docs
  const hostsRetreats = answers.hostsRetreats ||
    answers.primaryBusinessType === 'Retreats' ||
    (answers.services && answers.services.includes('Retreats or workshops'));

  if (hostsRetreats) {
    const retreatDocs = ALL_TEMPLATES.filter(t => ['template-retreat-waiver', 'template-travel'].includes(t.id));
    advancedDocs.push(...retreatDocs);
  }

  // IF Online Courses -> Website Terms (already added), but maybe explicit Digital Product terms?
  const offersOnline = answers.offersOnlineCourses ||
    answers.primaryBusinessType === 'Coaching' ||
    (answers.services && answers.services.includes('Online coaching / digital programs'));

  if (offersOnline) {
    const doc = ALL_TEMPLATES.find(t => t.id === 'template-refund'); // Refund Policy (good for digital)
    if (doc) advancedDocs.push(doc);
  }

  // IF Sells Products -> Refund Policy
  if (answers.sellsProducts) {
    const doc = ALL_TEMPLATES.find(t => t.id === 'template-refund');
    if (doc && !advancedDocs.includes(doc)) advancedDocs.push(doc);
  }

  // IF Client Photos -> Photo Release (it's free, but good to highlight)
  if (answers.usesPhotos) {
    // It's in freeDocs
  }

  // Deduplicate just in case
  advancedDocs = Array.from(new Set(advancedDocs));

  // Sort: Core first, then others
  // (Optional sorting logic here)

  // Pick top priorities - Core Legal Documents
  // We prioritize the Waiver, Service Agreement, and Website Terms as the "Big 3"
  const priorityIds = ['template-1', 'template-2', 'template-website'];
  const topPriorities = advancedDocs.filter(doc => priorityIds.includes(doc.id));

  return {
    freeTemplates: freeDocs,
    advancedTemplates: advancedDocs,
    topPriorities
  };
}
