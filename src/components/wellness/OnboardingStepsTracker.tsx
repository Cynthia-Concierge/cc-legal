import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import {
  CheckCircle2,
  Circle,
  Store,
  Globe,
  Search,
  FileText,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { UserAnswers } from '../../types/wellness';

interface OnboardingStepsTrackerProps {
  answers: UserAnswers;
  onCompleteProfile: () => void;
  onScanWebsite: () => void;
  onReviewDocuments: () => void;
  onDraftDocument: (docId: string) => void;
  hasCompletedContractReview?: boolean;
  hasScannedWebsite?: boolean;
  hasScanResults?: boolean;
  priorityDocumentId?: string;
}

export const OnboardingStepsTracker: React.FC<OnboardingStepsTrackerProps> = ({
  answers,
  onCompleteProfile,
  onScanWebsite,
  onReviewDocuments,
  onDraftDocument,
  hasCompletedContractReview = false,
  hasScannedWebsite = false,
  hasScanResults = false,
  priorityDocumentId
}) => {
  const isProfileComplete = answers.isProfileComplete;
  const totalSteps = 3;

  // Calculate completed steps
  let completedSteps = 0;
  if (isProfileComplete) completedSteps++;
  if (hasScannedWebsite) completedSteps++;
  if (hasCompletedContractReview) completedSteps++;
  // Draft step is considered complete if they've drafted at least one priority document
  // For now, we'll track this separately if needed

  const steps = [
    {
      id: 'profile',
      title: 'Complete Business Profile',
      description: 'Finalize your business details to customize your legal documents.',
      icon: Store,
      completed: isProfileComplete,
      action: onCompleteProfile,
      actionText: isProfileComplete ? 'Edit Profile' : 'Complete Profile',
      isOptional: false,
      disabled: false,
    },
    {
      id: 'website',
      title: 'Scan Website Compliance',
      description: hasScanResults ? 'View your previous scan results.' : 'Check if your website is missing mandatory legal pages.',
      icon: Globe,
      completed: hasScannedWebsite,
      action: onScanWebsite,
      actionText: hasScanResults ? 'View Results' : (hasScannedWebsite ? 'Rescan Website' : 'Scan Website'),
      isOptional: false,
    },
    {
      id: 'review',
      title: 'Analyze Existing Risks',
      description: 'Review old waivers or contracts for loopholes.',
      icon: Search,
      completed: hasCompletedContractReview,
      action: onReviewDocuments,
      actionText: hasCompletedContractReview ? 'Review Again' : 'Review Documents',
      isOptional: true,
    },
    // {
    //   id: 'draft',
    //   title: 'Draft Priority Protection',
    //   description: 'Generate your first essential legal document.',
    //   icon: FileText,
    //   completed: false, // This will be tracked separately
    //   action: () => priorityDocumentId && onDraftDocument(priorityDocumentId),
    //   actionText: 'Draft Now',
    //   isOptional: false,
    //   disabled: !priorityDocumentId,
    // },
  ];

  return (
    <Card className="bg-white shadow-lg border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CheckCircle2 className="text-brand-600" size={20} />
            Your Legal Action Plan
          </CardTitle>
          <div className="px-3 py-1 bg-slate-900 text-white text-sm font-bold rounded-md">
            {completedSteps}/{totalSteps} STEPS DONE
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Complete these steps to minimize your liability.
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              {/* Step Content */}
              <div className="flex gap-4 py-6">
                {/* Left: Icon and Connector */}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                    ${step.completed
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                    }
                    transition-all duration-200
                  `}>
                    {step.completed ? (
                      <CheckCircle2 size={20} className="text-white" />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`
                      w-0.5 flex-1 my-2
                      ${step.completed ? 'bg-brand-600' : 'bg-slate-200'}
                      transition-colors duration-200
                    `} />
                  )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`
                        font-semibold text-base
                        ${step.completed ? 'text-slate-900' : 'text-slate-700'}
                      `}>
                        {step.title}
                      </h3>
                      {step.isOptional && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      )}
                      {step.completed && (
                        <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      onClick={step.action}
                      disabled={step.disabled}
                      variant={step.completed ? "outline" : "primary"}
                      size="sm"
                      className={`
                        ${step.completed
                          ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }
                        flex items-center gap-1.5
                      `}
                    >
                      {step.actionText}
                      {!step.completed && <ArrowRight size={14} />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {!isLast && (
                <div className="absolute left-6 top-20 bottom-0 w-px bg-slate-200" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
