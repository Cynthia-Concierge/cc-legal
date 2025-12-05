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
export type PrimaryConcern = 
  | "I'm not sure what documents I need"
  | 'I want to protect myself from liability'
  | 'I want to protect my website + online content'
  | 'I want to legally protect my staff/contractors'
  | 'I run retreats and need to protect myself'
  | 'I want to protect my brand (IP/trademark)'
  | 'Everything feels overwhelming — I need guidance'
  | '';

export interface UserAnswers {
  email?: string;
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
  isProfileComplete?: boolean;
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
