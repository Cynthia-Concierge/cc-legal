import { UserAnswers, ScoreResult } from '../../types/wellness';

export function calculateScore(answers: UserAnswers): ScoreResult {
  let rawScore = 0;

  // Rule 1: Movement = 30 points
  if (answers.hasPhysicalMovement) {
    rawScore += 30;
  }

  // Rule 2: Retreats = 25 points
  const offersRetreats = answers.services.includes('Retreats or workshops');
  if (offersRetreats || answers.isOffsiteOrInternational) {
    rawScore += 25;
  }

  // Rule 3: Hiring = 20 points
  // Boost score if they have a larger staff count
  if (answers.hiresStaff) {
    rawScore += 20;
    if (answers.staffCount === '4-10') rawScore += 5;
    if (answers.staffCount === '10+') rawScore += 10;
  }

  // Rule 4: Online = 15 points
  if (answers.collectsOnline) {
    rawScore += 15;
  }

  // Rule 5: Digital Programs = 10 points
  if (answers.services.includes('Online coaching / digital programs')) {
    rawScore += 10;
  }

  // Rule 6: Group Classes = 10 points
  if (answers.services.includes('Group classes')) {
    rawScore += 10;
  }

  // Rule 7: Photos/Video (New) = 5 points
  if (answers.usesPhotos) {
    rawScore += 5;
  }

  // Rule 8: Client Volume (New)
  if (answers.clientCount === '50-200') rawScore += 5;
  if (answers.clientCount === '200+') rawScore += 10;

  // Max theoretical score is approx 140 now. Convert to 0-100 scale.
  // Formula: (Raw / 130) * 100
  const normalizedScore = Math.min(Math.round((rawScore / 130) * 100), 100);

  let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (normalizedScore >= 70) riskLevel = 'High';
  else if (normalizedScore >= 40) riskLevel = 'Moderate';

  return {
    score: normalizedScore,
    riskLevel
  };
}
