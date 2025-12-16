export type BusinessType =
  | 'Yoga Studio'
  | 'Pilates Studio'
  | 'Gym / Fitness Studio'
  | 'Retreat Leader'
  | 'Online Coach'
  | 'Personal Trainer'
  | 'Wellness Practitioner'
  | 'Breathwork / Meditation'
  | 'Hybrid (Online + In-person)'
  | '';

export type StaffCount = '0' | '1-3' | '4-10' | '10+';
export type ClientCount = '0-20' | '20-50' | '50-200' | '200+';

export type EntityType =
  | 'LLC'
  | 'Corporation'
  | 'Sole Proprietorship'
  | 'Partnership'
  | '';
export type PrimaryConcern =
  | "I'm not sure what documents I need"
  | 'I want to protect myself from liability'
  | 'I want to protect my website + online content'
  | 'I want to legally protect my staff/contractors'
  | 'I run retreats and need to protect myself'
  | 'I want to protect my brand (IP/trademark)'
  | 'Everything feels overwhelming — I need guidance'
  | '';

// New primary business type question
export type PrimaryBusinessType =
  | 'Yoga'
  | 'Pilates'
  | 'Gym'
  | 'Retreats'
  | 'Coaching'
  | 'Breathwork';

export interface UserAnswers {
  email?: string;
  primaryBusinessType?: PrimaryBusinessType;
  services: string[];
  hasPhysicalMovement: boolean;
  collectsOnline: boolean;
  hiresStaff: boolean;
  isOffsiteOrInternational: boolean;
  businessName?: string;
  website?: string;
  instagram?: string;
  businessType?: BusinessType;
  staffCount?: StaffCount;
  clientCount?: ClientCount;
  usesPhotos?: boolean;
  primaryConcern?: PrimaryConcern;

  // Phase 7: Deep Profiling Fields
  hostsRetreats?: boolean;
  offersOnlineCourses?: boolean;
  hasEmployees?: boolean; // W2 employees specifically (vs contractors)
  sharesSpace?: boolean; // For sublease/rental agreements
  sellsProducts?: boolean; // For physical product liability
  isProfileComplete?: boolean;

  // Legal Entity Fields (for document auto-fill)
  legalEntityName?: string;
  entityType?: EntityType;
  state?: string;
  businessAddress?: string;
  ownerName?: string;
  phone?: string;
}

export interface ScoreResult {
  score: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
}

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  isLocked: boolean;
  category: 'free' | 'advanced';
  pdfPath?: string;
}

export interface RecommendationResult {
  freeTemplates: DocumentItem[];
  advancedTemplates: DocumentItem[];
  topPriorities: DocumentItem[];
}

export interface OnboardingProgress {
  hasScannedWebsite: boolean;
  hasCompletedContractReview: boolean;
  documentsDrafted?: string[]; // IDs of documents drafted
  documentsDownloaded?: string[]; // IDs of documents downloaded
}

export interface UserDocument {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  category: 'contract' | 'insurance' | 'license' | 'formation' | 'other';
  document_type?: string; // Template ID (e.g., 'template-1', 'template-intake') for accurate matching
  analysis?: string;
  created_at: string;
}

export interface DashboardState {
  answers: UserAnswers | null;
  score: ScoreResult | null;
  recommendations: RecommendationResult | null;
  progress: OnboardingProgress;
  documents?: UserDocument[];
}
