import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import { RecommendationResult, UserAnswers } from '../../../types/wellness';

interface ProtectionJourneyProps {
  answers: UserAnswers;
  recommendations: RecommendationResult;
  hasScannedWebsite: boolean;
  hasCompletedContractReview: boolean;
  onBookCall: () => void;
  onGoToProfile: () => void;
  onOpenDocuments: () => void;
  onScanWebsite: () => void;
  onReviewContracts: () => void;
}

interface JourneyTask {
  label: string;
  completed: boolean;
  onClick?: () => void;
}

const getLevelCompletion = (tasks: JourneyTask[]): number => {
  if (!tasks.length) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};

export const ProtectionJourney: React.FC<ProtectionJourneyProps> = ({
  answers,
  recommendations,
  hasScannedWebsite,
  hasCompletedContractReview,
  onBookCall,
  onGoToProfile,
  onOpenDocuments,
  onScanWebsite,
  onReviewContracts,
}) => {
  const isProfileComplete = !!answers.isProfileComplete;

  // Level 1 – Foundations
  const level1Tasks: JourneyTask[] = [
    {
      label: 'Created account',
      completed: true, // If they see this dashboard, they have an account
    },
    {
      label: 'Completed business profile',
      completed: isProfileComplete,
      onClick: isProfileComplete ? undefined : onGoToProfile,
    },
  ];

  const level1Completion = getLevelCompletion(level1Tasks);

  // Level 2 – Core protections
  const level2Tasks: JourneyTask[] = [
    {
      label: 'Downloaded or generated your first legal document',
      // For now we assume they still need to do this; future: track via progress
      completed: false,
      onClick: onOpenDocuments,
    },
    {
      label: 'Scanned website for missing policies',
      completed: hasScannedWebsite,
      onClick: hasScannedWebsite ? undefined : onScanWebsite,
    },
    {
      label: 'Reviewed existing waivers / contracts',
      completed: hasCompletedContractReview,
      onClick: hasCompletedContractReview ? undefined : onReviewContracts,
    },
  ];

  const level2Completion = getLevelCompletion(level2Tasks);

  // Level 3 – Lawyer‑verified protection
  const level3Tasks: JourneyTask[] = [
    {
      label: 'Personalized all recommended documents for your business',
      completed: false,
      onClick: onOpenDocuments,
    },
    {
      label: 'Booked legal review call with Conscious Counsel',
      completed: false,
      onClick: onBookCall,
    },
  ];

  const level3Completion = getLevelCompletion(level3Tasks);

  const totalRecommendedDocs = recommendations.topPriorities.length + recommendations.advancedTemplates.length;

  return (
    <Card className="bg-white shadow-md border-slate-200">
      <CardHeader className="pb-4 flex items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Trophy className="text-amber-500" size={20} />
            Your Protection Journey
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Move through each level to go from &quot;just getting started&quot; to lawyer‑reviewed protection.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Level 1 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900">Level 1: Foundations</p>
            <span className="text-xs font-semibold text-slate-500">
              {level1Completion === 100 ? 'COMPLETE' : `${level1Completion}% complete`}
            </span>
          </div>
          <ul className="space-y-1.5">
            {level1Tasks.map((task) => (
              <li
                key={task.label}
                className={`flex items-center gap-2 text-sm text-slate-600 ${
                  !task.completed && task.onClick ? 'cursor-pointer hover:text-slate-900' : ''
                }`}
                onClick={() => {
                  if (!task.completed && task.onClick) task.onClick();
                }}
              >
                {task.completed ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Circle size={14} className="text-slate-300" />
                )}
                <span>{task.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Level 2 */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900">Level 2: Core Protections</p>
            <span className="text-xs font-semibold text-slate-500">
              {level2Completion === 100 ? 'COMPLETE' : `${level2Completion}% complete`}
            </span>
          </div>
          <ul className="space-y-1.5">
            {level2Tasks.map((task) => (
              <li
                key={task.label}
                className={`flex items-center gap-2 text-sm text-slate-600 ${
                  !task.completed && task.onClick ? 'cursor-pointer hover:text-slate-900' : ''
                }`}
                onClick={() => {
                  if (!task.completed && task.onClick) task.onClick();
                }}
              >
                {task.completed ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Circle size={14} className="text-slate-300" />
                )}
                <span>{task.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Level 3 */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900">Level 3: Lawyer‑Verified</p>
            <span className="text-xs font-semibold text-slate-500">
              {level3Completion === 100 ? 'COMPLETE' : `${level3Completion}% complete`}
            </span>
          </div>
          <ul className="space-y-1.5 mb-3">
            {level3Tasks.map((task) => (
              <li
                key={task.label}
                className={`flex items-center gap-2 text-sm text-slate-600 ${
                  !task.completed && task.onClick ? 'cursor-pointer hover:text-slate-900' : ''
                }`}
                onClick={() => {
                  if (!task.completed && task.onClick) task.onClick();
                }}
              >
                {task.completed ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Circle size={14} className="text-slate-300" />
                )}
                <span>{task.label}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-slate-500 mb-3">
            Based on your answers, we&apos;ve identified{' '}
            <span className="font-semibold text-slate-700">
              {totalRecommendedDocs} recommended documents
            </span>{' '}
            to fully protect your business. Generating these and booking a review call gets you as close to
            &quot;bulletproof&quot; as possible.
          </div>
          <Button
            size="sm"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            onClick={onBookCall}
          >
            Book Legal Review Call
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


