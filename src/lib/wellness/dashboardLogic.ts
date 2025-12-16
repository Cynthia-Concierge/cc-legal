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
    const { answers, progress, score } = state;

    if (!answers || !score) return 0;

    // Base health is the inverse of the risk score:
    // High risk (e.g. 80) → low health (20), Low risk (e.g. 20) → high health (80)
    let health = 100 - score.score;

    // Progress bonus: each major action improves health a bit, but can't fully
    // offset very high inherent risk. Max bonus = 20 points.
    if (answers.isProfileComplete) health += 5;
    if (progress.hasScannedWebsite) health += 5;
    if (progress.hasCompletedContractReview) health += 5;
    if (
        (progress.documentsDrafted && progress.documentsDrafted.length > 0) ||
        (progress.documentsDownloaded && progress.documentsDownloaded.length > 0)
    ) {
        health += 5;
    }

    return Math.max(0, Math.min(health, 100));
};

export const getNextBestAction = (state: DashboardState): NextAction => {
    const { answers, progress, recommendations, score } = state;

    // Priority 1: Upload Existing Documents
    if (!progress.hasCompletedContractReview) {
        return {
            title: 'Upload and Analyze Your Current Documents',
            description: 'Upload your existing waivers or contracts and have them analyzed for loopholes.',
            actionLabel: 'Upload Documents',
            actionType: 'review',
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



    // Fallback: Book a Call
    return {
        title: 'Get a Professional Opinion',
        description: 'You\'ve made great progress. Have a lawyer review your setup for total peace of mind.',
        actionLabel: 'Book Free Call',
        actionType: 'call',
        priority: 'medium'
    };
};
