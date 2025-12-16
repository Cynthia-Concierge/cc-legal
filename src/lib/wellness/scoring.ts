import { UserAnswers, ScoreResult } from '../../types/wellness';

/**
 * Legal Risk Scoring
 *
 * This is a simple, explainable model that maps onboarding answers
 * → a 0–100 risk score and band (Low / Moderate / High).
 *
 * Higher score = more legal exposure.
 */
export function calculateScore(answers: UserAnswers): ScoreResult {
  let rawScore = 0;

  // 1. Core activity risk
  // Physical movement (injury risk – yoga, fitness, etc.)
  if (answers.hasPhysicalMovement) {
    rawScore += 25;
  }

  // Retreats / offsite / international travel
  const servicesIncludeRetreats = answers.services.includes('Retreats or workshops');
  if (answers.hostsRetreats || servicesIncludeRetreats || answers.isOffsiteOrInternational) {
    rawScore += 25;
  }

  // 2. People risk (staff & client volume)
  // Employees / staff (W-2) – higher HR / employment exposure
  const hasEmployees = answers.hasEmployees || answers.hiresStaff;
  if (hasEmployees) {
    rawScore += 20;
  }

  // Staff count makes risk climb a bit more
  if (answers.staffCount === '4-10') rawScore += 5;
  if (answers.staffCount === '10+') rawScore += 10;

  // Client volume – more people = more chances for something to go wrong
  if (answers.clientCount === '50-200') rawScore += 5;
  if (answers.clientCount === '200+') rawScore += 10;

  // 3. Online / digital exposure
  // Collecting money online (Stripe, Shopify, etc.)
  if (answers.collectsOnline) {
    rawScore += 15;
  }

  // Online courses, digital memberships, etc.
  const offersDigitalPrograms =
    answers.offersOnlineCourses ||
    answers.services.includes('Online coaching / digital programs');
  if (offersDigitalPrograms) {
    rawScore += 10;
  }

  // 4. Marketing & IP
  // Using client photos/videos in marketing
  if (answers.usesPhotos) {
    rawScore += 10;
  }

  // Selling physical products (supplements, equipment, merch)
  if (answers.sellsProducts) {
    rawScore += 10;
  }

  // 5. Group services (more people together at once)
  if (answers.services.includes('Group classes')) {
    rawScore += 5;
  }

  // Max theoretical rawScore is ~135. Convert to 0–100 scale.
  const normalizedScore = Math.min(Math.round((rawScore / 135) * 100), 100);

  let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (normalizedScore >= 65) riskLevel = 'High';
  else if (normalizedScore >= 35) riskLevel = 'Moderate';

  return {
    score: normalizedScore,
    riskLevel,
  };
}
