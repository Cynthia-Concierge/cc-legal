import { DashboardState, DocumentItem } from '../../types/wellness';

export interface NextAction {
    title: string;
    description: string;
    actionLabel: string;
    actionType: 'profile' | 'scan' | 'review' | 'draft' | 'call';
    targetId?: string; // e.g., document ID
    priority: 'critical' | 'high' | 'medium';
}

export const calculateLegalHealth = (state: DashboardState): number => {
    let score = 0;
    const { answers, progress } = state;

    if (!answers) return 0;

    // 1. Profile Completion (25 points)
    if (answers.isProfileComplete) score += 25;

    // 2. Initial Assessment / Risk Score (already done if we have answers) (15 points)
    score += 15;

    // 3. Website Scan (20 points)
    if (progress.hasScannedWebsite) score += 20;

    // 4. Contract Review (20 points)
    if (progress.hasCompletedContractReview) score += 20;

    // 5. Actions Taken (20 points)
    // Logic: has downloaded or drafted at least one document
    if (
        (progress.documentsDrafted && progress.documentsDrafted.length > 0) ||
        (progress.documentsDownloaded && progress.documentsDownloaded.length > 0)
    ) {
        score += 20;
    }

    return Math.min(score, 100);
};

export const getNextBestAction = (state: DashboardState): NextAction => {
    const { answers, progress, recommendations, score } = state;

    // Priority 1: Complete Profile
    if (!answers?.isProfileComplete) {
        return {
            title: 'Complete Your Business Profile',
            description: 'We need a few more details to give you accurate legal recommendations.',
            actionLabel: 'Complete Profile',
            actionType: 'profile',
            priority: 'critical'
        };
    }

    // Priority 2: Scan Website (High Impact, Low Effort)
    if (!progress.hasScannedWebsite && answers.website) {
        return {
            title: 'Scan Your Website Compliance',
            description: 'Your website might be missing critical disclaimers. Run a free instant scan.',
            actionLabel: 'Scan Now',
            actionType: 'scan',
            priority: 'high'
        };
    }

    // Priority 3: Review Existing Contracts (if high risk)
    if (!progress.hasCompletedContractReview && score?.riskLevel === 'High') {
        return {
            title: 'Review Your Current Waivers',
            description: 'Your high-risk activities require robust waivers. Let\'s check your current ones.',
            actionLabel: 'Start Review',
            actionType: 'review',
            priority: 'high'
        };
    }

    // Fallback: Book a Call
    return {
        title: 'Get a Professional Opinion',
        description: 'You\'ve made great progress. Have a lawyer review your setup for total peace of mind.',
        actionLabel: 'Book Free Call',
        actionType: 'call',
        priority: 'medium'
    };
};
