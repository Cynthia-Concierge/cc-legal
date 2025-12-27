/**
 * Onboarding Analytics Tracking
 * 
 * Tracks step-by-step progress through the onboarding flow
 * to identify drop-off points and completion rates
 */

import { supabase } from './supabase';

// Step names mapping
// Note: Steps 14, 15, 16 were removed (Customization Transition, Website Input, Review Progress)
// Flow now jumps from Step 13 (Contact Details) directly to Step 17 (Generated Documents)
const STEP_NAMES: Record<number, string> = {
  0: 'Welcome',
  1: 'Email Collection',
  2: 'Question 1: Primary Business Type',
  3: 'Question 2: Services Offered',
  4: 'Question 3: Physical Movement',
  5: 'Question 4: Online Collection',
  6: 'Question 5: Hires Staff',
  7: 'Question 6: Off-site Events',
  8: 'Question 7: W-2 Employees',
  9: 'Question 8: Sells Products',
  10: 'Question 9: Uses Photos',
  11: 'Recommendation Summary',
  12: 'Identity Form',
  13: 'Contact Details',
  // Steps 14-16: REMOVED (Dec 2024)
  17: 'Generated Documents',
  18: 'Lawyer Booking',
  19: 'Password Creation',
};

/**
 * Get or create a session ID for tracking
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('onboarding_session_id');
  if (!sessionId) {
    sessionId = `onboarding_${crypto.randomUUID()}`;
    sessionStorage.setItem('onboarding_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track an onboarding event
 */
export async function trackOnboardingEvent(
  stepNumber: number,
  eventType: 'started' | 'completed' | 'abandoned',
  options?: {
    email?: string;
    userId?: string;
    contactId?: string;
    entryPoint?: 'landing_page' | 'onboarding_direct';
    source?: string;
    timeSpentSeconds?: number;
  }
): Promise<void> {
  try {
    const sessionId = getSessionId();
    const stepName = STEP_NAMES[stepNumber] || `Step ${stepNumber}`;

    // Get entry point from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const entryPoint = options?.entryPoint || (eventId ? 'landing_page' : 'onboarding_direct');

    // Get source from localStorage or options
    const source = options?.source || 
      (entryPoint === 'landing_page' ? 'wellness' : 'onboarding_direct');

    const eventData = {
      session_id: sessionId,
      email: options?.email || null,
      user_id: options?.userId || null,
      contact_id: options?.contactId || null,
      step_number: stepNumber,
      step_name: stepName,
      event_type: eventType,
      entry_point: entryPoint,
      source: source,
      time_spent_seconds: options?.timeSpentSeconds || null,
    };

    // Try to save to Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('onboarding_events')
        .insert([eventData])
        .select();

      if (error) {
        console.error('❌ [Onboarding Analytics] Error tracking event:', error);
        console.error('❌ [Onboarding Analytics] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        console.error('❌ [Onboarding Analytics] Event data that failed:', eventData);
        
        // Fallback: log to console for debugging
        console.log('[Onboarding Analytics] Fallback log:', eventData);
      } else {
        console.log(`✅ [Onboarding Analytics] Tracked: ${stepName} - ${eventType}`, {
          session_id: eventData.session_id,
          step: eventData.step_number,
          entry_point: eventData.entry_point
        });
      }
    } else {
      // Fallback: log to console if Supabase not available
      console.warn('⚠️ [Onboarding Analytics] Supabase not available, logging to console:', eventData);
    }
  } catch (error) {
    console.error('Error in trackOnboardingEvent:', error);
    // Don't throw - analytics should never break the user experience
  }
}

/**
 * Track when user abandons onboarding (leaves page)
 */
export function trackOnboardingAbandonment(
  currentStep: number,
  email?: string
): void {
  const sessionId = getSessionId();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');
  const entryPoint = eventId ? 'landing_page' : 'onboarding_direct';
  const source = entryPoint === 'landing_page' ? 'wellness' : 'onboarding_direct';

  const eventData = {
    session_id: sessionId,
    step_number: currentStep,
    step_name: STEP_NAMES[currentStep] || `Step ${currentStep}`,
    event_type: 'abandoned' as const,
    entry_point: entryPoint,
    source: source,
    email: email || null,
  };

  // Use sendBeacon for reliable tracking even if page is closing
  if (navigator.sendBeacon) {
    const API_BASE_URL = import.meta.env.VITE_SERVER_URL || '';
    const endpoint = `${API_BASE_URL}/api/track-onboarding-event`;
    
    try {
      const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      
      if (sent) {
        console.log(`[Onboarding Analytics] ✅ Abandonment tracked via sendBeacon: Step ${currentStep}`);
      } else {
        console.warn(`[Onboarding Analytics] ⚠️ sendBeacon failed, trying regular tracking`);
        // Fallback to regular tracking
        trackOnboardingEvent(currentStep, 'abandoned', { email, entryPoint, source });
      }
    } catch (err) {
      console.error('[Onboarding Analytics] Error with sendBeacon:', err);
      // Fallback to regular tracking
      trackOnboardingEvent(currentStep, 'abandoned', { email, entryPoint, source });
    }
  } else {
    // Fallback: use regular tracking if sendBeacon not available
    trackOnboardingEvent(currentStep, 'abandoned', { email, entryPoint, source });
  }
}
