import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserAnswers } from '../../types/wellness';
import { ProgressBar } from '../../components/wellness/ui/ProgressBar';
import { QuestionCard } from '../../components/wellness/onboarding/QuestionCard';
import { ShieldCheck, Mail, Globe, Upload, Download, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/use-toast';
import { RecommendationSummary } from '../../components/wellness/onboarding/RecommendationSummary';
import { IdentityForm } from '../../components/wellness/onboarding/IdentityForm';
import { ContactDetailsForm } from '../../components/wellness/onboarding/ContactDetailsForm';
import { GeneratedDocumentsCard } from '../../components/wellness/onboarding/GeneratedDocumentsCard';
import { LawyerBookingCard } from '../../components/wellness/onboarding/LawyerBookingCard';
import { getRecommendedDocuments } from '../../lib/wellness/documentEngine';
import { trackOnboardingEvent, trackOnboardingAbandonment } from '../../lib/onboardingAnalytics';

const INITIAL_ANSWERS: UserAnswers = {
  services: [],
  hasPhysicalMovement: true,
  collectsOnline: true,
  hiresStaff: true,
  isOffsiteOrInternational: true,
  hasEmployees: true,
  sellsProducts: true,
  usesPhotos: true,
};

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  // Initialize step to 1 if skipWelcome is true, otherwise 0
  // Check URL directly to avoid hook dependency in initializer
  const [step, setStep] = useState(1); // Default to 1 (Email capture) to skip welcome screen
  const [answers, setAnswers] = useState<UserAnswers>(INITIAL_ANSWERS);
  // Email step state - must be at top level (Rules of Hooks)
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingExistingUser, setIsCheckingExistingUser] = useState(true);
  const [isTempPassword, setIsTempPassword] = useState(true); // Default to true (assume new user)

  // Password step state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false); // For users who already have a password but want to change it

  // Auto-advance state
  const [hasAutoSubmittedEmail, setHasAutoSubmittedEmail] = useState(false);

  // Analytics tracking: track when each step started (for time calculation)
  const stepStartTimeRef = useRef<number>(Date.now());
  const previousStepRef = useRef<number>(-1); // Initialize to -1 so first step gets tracked

  // Helper function to create business profile (called both when password is set and when skipped)
  const createBusinessProfile = async (user: any) => {
    if (!user) {
      console.warn('⚠️ No user provided to createBusinessProfile');
      return;
    }

    try {
      console.log('🏢 Creating initial Business Profile with onboarding data...');

      // Map Primary Business Type to Profile Business Type
      let mappedBusinessType = answers.businessType || '';
      if (!mappedBusinessType && answers.primaryBusinessType) {
        switch (answers.primaryBusinessType) {
          case 'Yoga': mappedBusinessType = 'Yoga Studio'; break;
          case 'Pilates': mappedBusinessType = 'Pilates Studio'; break;
          case 'Gym': mappedBusinessType = 'Gym / Fitness Studio'; break;
          case 'Retreats': mappedBusinessType = 'Retreat Leader'; break;
          case 'Coaching': mappedBusinessType = 'Online Coach'; break;
          case 'Breathwork': mappedBusinessType = 'Breathwork / Meditation'; break;
        }
      }

      // Synthesize boolean flags for Profile synchronization
      const derivedHostsRetreats = !!(
        answers.hostsRetreats ||
        answers.services?.includes('Retreats or workshops') ||
        answers.isOffsiteOrInternational ||
        answers.primaryBusinessType === 'Retreats'
      );

      const derivedOffersOnline = !!(
        answers.offersOnlineCourses ||
        answers.services?.includes('Online coaching / digital programs') ||
        answers.primaryBusinessType === 'Coaching'
      );

      // SYNC WEBSITE FROM CONTACTS TABLE IF MISSING
      // If website wasn't entered during onboarding, check if it exists in contacts table
      let websiteUrl = answers.website || '';
      if (!websiteUrl && user.email && supabase) {
        try {
          const { data: contactData } = await supabase
            .from('contacts')
            .select('website')
            .eq('email', user.email.trim().toLowerCase())
            .single();
          
          if (contactData?.website && contactData.website.trim()) {
            websiteUrl = contactData.website.trim();
            console.log('✅ Synced website from contacts table:', websiteUrl);
          }
        } catch (contactError) {
          console.warn('⚠️ Could not fetch website from contacts:', contactError);
          // Continue without website - not a critical error
        }
      }

      // PREPARE DATA PAYLOAD
      const profilePayload = {
        user_id: user.id,
        website_url: websiteUrl,

        // Website scan step removed - these fields will be empty/false for new onboarding users
        has_scanned_website: !!(websiteUrl && websiteUrl.length > 3),
        website_scan_completed_at: websiteUrl ? new Date().toISOString() : null,

        business_type: mappedBusinessType,
        // Map boolean flags
        has_physical_movement: answers.hasPhysicalMovement,
        collects_online: answers.collectsOnline,
        hires_staff: answers.hiresStaff,
        is_offsite_or_international: answers.isOffsiteOrInternational,

        // Profile Section Boolean Sync
        hosts_retreats: derivedHostsRetreats,
        offers_online_courses: derivedOffersOnline,
        uses_photos: answers.usesPhotos || false,

        // Map arrays/new fields
        services: answers.services || [],
        has_w2_employees: answers.hasEmployees || false,
        sells_products: answers.sellsProducts || false,

        // Legal Entity & Contact Info
        business_name: answers.legalEntityName || answers.businessName || '', // Auto-fill business name from legal entity
        legal_entity_name: answers.legalEntityName || '',
        entity_type: answers.entityType || '',
        state: answers.state || '',
        business_address: answers.businessAddress || '',
        owner_name: answers.ownerName || '',
        phone: answers.phone || '',

        updated_at: new Date().toISOString()
      };

      // BACKUP: Save to localStorage in case DB write fails or race condition
      try {
        localStorage.setItem('pending_business_profile', JSON.stringify(profilePayload));
        console.log('💾 Backup profile data saved to localStorage');
      } catch (e) {
        console.warn('Failed to save backup profile to localStorage', e);
      }

      if (supabase) {
        const { error: profileError } = await supabase
          .from('business_profiles')
          .upsert(profilePayload, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('❌ Error creating initial business profile:', profileError);
          // We don't block navigation, relying on the localStorage backup
        } else {
          console.log('✅ Initial Business Profile created successfully');

          // Also update the contact table with additional info collected during onboarding
          if (user.email && (answers.website || answers.phone || answers.ownerName)) {
            try {
              const contactUpdate: any = {
                updated_at: new Date().toISOString()
              };

              if (answers.website) contactUpdate.website = answers.website;
              if (answers.phone) contactUpdate.phone = answers.phone;
              if (answers.ownerName) contactUpdate.name = answers.ownerName;

              const { error: contactError } = await supabase
                .from('contacts')
                .update(contactUpdate)
                .eq('email', user.email);

              if (contactError) {
                console.warn('⚠️ Failed to update contact info:', contactError);
              } else {
                console.log('✅ Contact updated with:', contactUpdate);
              }
            } catch (contactUpdateError) {
              console.error('Error updating contact info:', contactUpdateError);
            }
          }

          // If they scanned, also save progress to localStorage for Dashboard strictly
          if (answers.website) {
            const progress = {
              hasScannedWebsite: true,
              hasCompletedContractReview: false,
            };
            localStorage.setItem('wellness_onboarding_progress', JSON.stringify(progress));
          }

          // Mark profile as complete in localStorage for document generation
          // This allows users to generate personalized documents immediately after onboarding
          const updatedAnswers: UserAnswers = {
            ...answers,
            isProfileComplete: true
          };
          localStorage.setItem('wellness_onboarding_answers', JSON.stringify(updatedAnswers));
          console.log('✅ Profile marked as complete in localStorage');
        }
      }
    } catch (profileErr) {
      console.error('❌ Exception creating business profile:', profileErr);
    }
  };

  const handlePasswordSubmit = async () => {
    // If not updating and already has password, just continue
    if (!isTempPassword && !isUpdatingPassword) {
      navigate('/wellness/dashboard');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setPasswordError('');

    if (supabase) {
      try {
        // CRITICAL FIX: Check if user has an active session first
        let session = (await supabase.auth.getSession()).data.session;

        if (!session) {
          console.error('❌ No active session found when trying to update password');

          // Try to get the user's email and temp password from storage
          const userEmail = answers.email;
          const tempPassword = sessionStorage.getItem('wellness_temp_password');

          if (!userEmail) {
            throw new Error('Session expired. Please refresh the page and start again.');
          }

          if (!tempPassword) {
            console.error('❌ No temp password found in storage');
            throw new Error('Session expired. Please refresh the page and start again.');
          }

          // Try to sign in with the temp password to establish a session
          console.log('🔐 Attempting to sign in with temp password to establish session...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: tempPassword
          });

          if (signInError) {
            console.error('❌ Failed to sign in with temp password:', signInError);

            // Check if this is an email confirmation issue
            if (signInError.message?.toLowerCase().includes('email') &&
              (signInError.message?.toLowerCase().includes('confirm') ||
                signInError.message?.toLowerCase().includes('verif'))) {
              throw new Error('Please check your email and confirm your account before setting a password.');
            }

            throw new Error('Could not establish session. Please refresh the page and try again.');
          }

          if (!signInData.session) {
            throw new Error('Sign in succeeded but no session created. Please refresh the page.');
          }

          session = signInData.session;
          console.log('✅ Session established successfully');
        }

        // User has a session, proceed with password update
        const { error } = await supabase.auth.updateUser({
          password: password,
          data: { temp_password: false } // Mark as no longer temp
        });

        if (error) throw error;

        // Clear temp password from storage since user has set their real password
        sessionStorage.removeItem('wellness_temp_password');
        console.log('🗑️ Temp password removed from sessionStorage');

        // Post-password operations: Email, Users Table, & Business Profile
        try {
          // Get fresh session after password update
          const { data: { session } } = await supabase.auth.getSession();
          const { data: { user } } = await supabase.auth.getUser();

          console.log('🔐 Session check:', {
            hasSession: !!session,
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            tempPassword: user?.user_metadata?.temp_password
          });

          if (user) {
            // Database trigger automatically handles:
            // - Adding user to users table
            // - Linking contact record to user
            console.log('✅ Password set successfully. Database trigger will handle user creation.');

            const userName = user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'User';

            // Send welcome email when user sets password
            if (user.email) {
              console.log('📧 Triggering welcome email after password creation...');
              fetch('/api/emails/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  name: userName || user.email.split('@')[0]
                })
              }).catch(err => console.error('❌ Welcome email error:', err));

              // Schedule nurture sequence emails (Day 3, 5, 7, 10) via Cloud Tasks
              console.log('📅 Scheduling nurture sequence emails...');
              const serverUrl = import.meta.env.VITE_SERVER_URL || '';
              fetch(`${serverUrl}/api/emails/schedule-nurture-sequence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id
                })
              }).catch(err => console.error('❌ Nurture sequence scheduling error:', err));
            }

            // Wait a moment for trigger to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // CREATE BUSINESS PROFILE
            // Ensure all onboarding data (including website scan) is persisted so the Dashboard is ready.
            await createBusinessProfile(user);

            // Track onboarding completion (step 19 - password creation)
            const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
            trackOnboardingEvent(19, 'completed', {
              email: user.email || answers.email,
              userId: user.id,
              timeSpentSeconds: timeSpent > 0 ? timeSpent : null,
              entryPoint: searchParams.get('eventId') ? 'landing_page' : 'onboarding_direct',
              source: searchParams.get('eventId') ? 'wellness' : 'onboarding_direct',
            });

            // Navigate to Dashboard as this is now the final step
            navigate('/wellness/dashboard');

          } // Close if (user)
        } catch (postUpdateErr) {
          console.error('❌ Error in post-password operations:', postUpdateErr);
        }

        // Create Business Profile even for existing users if it doesn't exist?
        // Actually, createBusinessProfile is safest to run to ensure sync
        // But if they are just logging in, maybe we shouldn't overwrite?
        // For onboarding context, we assume we want to save their current answers.

        // Success - Move to Review Card (Step 17)
        setStep(17);
      } catch (err: any) {
        console.error('❌ Error setting password:', err);
        console.error('❌ Error details:', {
          message: err.message,
          code: err.code,
          status: err.status,
          details: err.details,
          hint: err.hint
        });
        setPasswordError(err.message || 'Failed to update password. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Fallback if no supabase
      navigate('/wellness/dashboard');
    }
  };

  // Handler for when user skips password creation
  const handleSkipPassword = async () => {
    setIsSubmitting(true);

    try {
      // Keep temp password in sessionStorage since they might come back later
      // We'll only clear it when they actually set a real password

      // Get current user (should have temp password from email step)
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log('⏭️ User skipping password, saving business profile anyway...');
          // Create business profile even though they skipped password
          await createBusinessProfile(user);

          // Track onboarding completion (step 19 - password skipped)
          const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
          trackOnboardingEvent(19, 'completed', {
            email: user.email || answers.email,
            userId: user.id,
            timeSpentSeconds: timeSpent > 0 ? timeSpent : null,
            entryPoint: searchParams.get('eventId') ? 'landing_page' : 'onboarding_direct',
            source: searchParams.get('eventId') ? 'wellness' : 'onboarding_direct',
          });
        } else {
          console.warn('⚠️ No user found when skipping password');
        }
      }
    } catch (err) {
      console.error('Error handling skip:', err);
    } finally {
      setIsSubmitting(false);
      // Move to Dashboard (Final Step)
      navigate('/wellness/dashboard');
    }
  };

  const updateAnswer = (key: keyof UserAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  // Check if user is already logged in and has completed onboarding
  // This MUST run immediately before rendering anything
  useEffect(() => {
    const checkExistingUser = async () => {
      // Check if they have completed onboarding data FIRST
      const saved = localStorage.getItem('wellness_onboarding_answers');
      console.log('[Onboarding] Checking for existing user, saved data:', !!saved);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('[Onboarding] Parsed data (full):', JSON.stringify(parsed, null, 2));
          console.log('[Onboarding] Data breakdown:', {
            hasServices: !!parsed.services,
            servicesType: typeof parsed.services,
            isArray: Array.isArray(parsed.services),
            servicesLength: parsed.services?.length,
            servicesValue: parsed.services,
            hasPhysicalMovement: parsed.hasPhysicalMovement,
            hasPhysicalMovementType: typeof parsed.hasPhysicalMovement,
            collectsOnline: parsed.collectsOnline,
            collectsOnlineType: typeof parsed.collectsOnline,
            hiresStaff: parsed.hiresStaff,
            hiresStaffType: typeof parsed.hiresStaff,
            isOffsiteOrInternational: parsed.isOffsiteOrInternational,
            isOffsiteOrInternationalType: typeof parsed.isOffsiteOrInternational
          });

          // Check if onboarding is complete by verifying all required fields are answered
          // Required fields: primaryBusinessType, services (array with items), and all 4 boolean questions
          const hasPrimaryBusinessType = !!parsed.primaryBusinessType;
          const hasServices = parsed.services && Array.isArray(parsed.services) && parsed.services.length > 0;
          const hasAllBooleans = typeof parsed.hasPhysicalMovement === 'boolean' &&
            typeof parsed.collectsOnline === 'boolean' &&
            typeof parsed.hiresStaff === 'boolean' &&
            typeof parsed.isOffsiteOrInternational === 'boolean';
          const hasCompletedOnboarding = hasPrimaryBusinessType && hasServices && hasAllBooleans;

          console.log('[Onboarding] Completion check result:', {
            hasCompletedOnboarding,
            hasServices,
            hasAllBooleans,
            breakdown: {
              servicesCheck: `${!!parsed.services} && ${Array.isArray(parsed.services)} && ${parsed.services?.length} > 0 = ${hasServices}`,
              booleansCheck: `all 4 are boolean = ${hasAllBooleans}`
            }
          });

          // Check if user has a session (has password = onboarding complete)
          let hasActiveSession = false;
          let onboardingCompleteInMetadata = false;

          if (supabase) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              hasActiveSession = !!session;
              onboardingCompleteInMetadata = session?.user?.user_metadata?.onboarding_complete === true;

              // Check if they have a temp password
              const isTemp = session?.user?.user_metadata?.temp_password !== false; // Default to true if undefined or true
              setIsTempPassword(isTemp);

              console.log('[Onboarding] Session check:', {
                hasActiveSession,
                userId: session?.user?.id,
                onboardingCompleteInMetadata,
                hasPassword: hasActiveSession, // If they have a session, they have a password
                isTempPassword: isTemp
              });

              // If user has a session (can log in), they have a password = onboarding is complete
              // Redirect to dashboard
              if (hasActiveSession) {
                console.log('[Onboarding] User has password (onboarding complete) - redirecting to dashboard');
                navigate('/wellness/dashboard', { replace: true });
                return;
              }
            } catch (sessionErr) {
              console.error('[Onboarding] Error checking session:', sessionErr);
            }
          }

          // Fallback: If they have completed onboarding data in localStorage, also redirect
          if (hasCompletedOnboarding) {
            console.log('[Onboarding] User has completed onboarding data - redirecting to dashboard');
            navigate('/wellness/dashboard', { replace: true });
            return;
          }

          // They have partial data, continue onboarding
          console.log('[Onboarding] User has partial data, continuing onboarding');
          setAnswers(parsed);
          // Set email input if it exists in saved answers
          if (parsed.email) {
            setEmailInput(parsed.email);
          }
        } catch (e) {
          console.error("[Onboarding] Failed to parse saved answers:", e);
        }
      } else {
        console.log('[Onboarding] No saved onboarding data found');
      }

      // Check for email from URL params (if passed)
      const emailFromUrl = searchParams.get('email');
      if (emailFromUrl) {
        setEmailInput(emailFromUrl);
        setAnswers(prev => ({ ...prev, email: emailFromUrl }));
      } else {
        // Check sessionStorage for email from previous form submission
        const emailFromSession = sessionStorage.getItem('wellness_form_email');
        if (emailFromSession) {
          setEmailInput(emailFromSession);
          setAnswers(prev => ({ ...prev, email: emailFromSession }));
          // Clear it from sessionStorage after using it
          sessionStorage.removeItem('wellness_form_email');
        }
      }
    };

    checkExistingUser().finally(() => {
      setIsCheckingExistingUser(false);
    });
  }, [searchParams, navigate]);

  // Save to local storage on change
  // Only save if we're not checking for existing user (to avoid overwriting during redirect check)
  useEffect(() => {
    if (!isCheckingExistingUser) {
      localStorage.setItem('wellness_onboarding_answers', JSON.stringify(answers));
    }
  }, [answers, isCheckingExistingUser]);

  // Track step changes for analytics
  useEffect(() => {
    if (isCheckingExistingUser) {
      console.log('[Onboarding Analytics] ⏳ Waiting for user check to complete before tracking...');
      return; // Don't track during initial load
    }

    const currentTime = Date.now();
    const previousStep = previousStepRef.current;

    // If step changed, track completion of previous step and start of new step
    if (previousStep !== step && previousStep >= 0) {
      // Calculate time spent on previous step
      const timeSpent = Math.floor((currentTime - stepStartTimeRef.current) / 1000);

      // Track completion of previous step (if it was a real step, not initial load)
      if (previousStep >= 0) {
        console.log(`[Onboarding Analytics] 📊 Step ${previousStep} completed, moving to step ${step}`);
        trackOnboardingEvent(previousStep, 'completed', {
          email: answers.email,
          timeSpentSeconds: timeSpent > 0 ? timeSpent : null,
          entryPoint: searchParams.get('eventId') ? 'landing_page' : 'onboarding_direct',
          source: searchParams.get('eventId') ? 'wellness' : 'onboarding_direct',
        }).catch(err => {
          console.error(`[Onboarding Analytics] ❌ Failed to track step ${previousStep} completion:`, err);
        });
      }
    }

    // Track start of current step
    const entryPoint = searchParams.get('eventId') ? 'landing_page' : 'onboarding_direct';
    const source = searchParams.get('eventId') ? 'wellness' : 'onboarding_direct';

    console.log(`[Onboarding Analytics] 📊 Tracking step ${step} started (entry: ${entryPoint})`);
    trackOnboardingEvent(step, 'started', {
      email: answers.email,
      entryPoint: entryPoint,
      source: source,
    }).catch(err => {
      console.error(`[Onboarding Analytics] ❌ Failed to track step ${step} started:`, err);
    });

    // Update refs
    previousStepRef.current = step;
    stepStartTimeRef.current = currentTime;
  }, [step, answers.email, searchParams, isCheckingExistingUser]);

  // Track abandonment when user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackOnboardingAbandonment(step, answers.email);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, answers.email]);

  // Auto-submit email if provided in session or URL (and skipping welcome)
  // This must be AFTER the initial checkExistingUser effect which populates emailInput
  useEffect(() => {
    // Wait for checking existing user to finish
    if (isCheckingExistingUser) return;

    // Only if we are on step 1 (Email)
    // We check step === 1 because skipWelcome=true sets initial step to 1
    if (step === 1 && !hasAutoSubmittedEmail && !isSubmitting) {
      // Check for email
      const email = emailInput || answers.email || searchParams.get('email');

      const shouldAutoSubmit =
        searchParams.get('skipWelcome') === 'true' &&
        email &&
        email.includes('@') &&
        email.length > 5;

      if (shouldAutoSubmit) {
        console.log('[Onboarding] Auto-submitting email step for:', email);
        setHasAutoSubmittedEmail(true);
        // Call submit handler
        handleEmailSubmit(email);
      }
    }
  }, [step, emailInput, answers.email, searchParams, isCheckingExistingUser, hasAutoSubmittedEmail, isSubmitting]);

  const handleEmailSubmit = async (email: string) => {
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address to continue.",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();

    // Save email to answers
    updateAnswer('email', trimmedEmail);

    // Get API base URL and check if user came from landing page
    const API_BASE_URL =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? "" : "");
    const eventIdFromUrl = searchParams.get('eventId');

    // Save email to contacts table (only for direct onboarding visitors)
    // If they came from landing page, contact is already saved
    if (!eventIdFromUrl) {
      // Direct visitor - save to contacts table
      try {
        const emailPrefix = trimmedEmail.split('@')[0] || 'Onboarding User';
        const contactResponse = await fetch(`${API_BASE_URL}/api/save-contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: emailPrefix, // Use email prefix as name placeholder
            email: trimmedEmail,
            phone: "",
            website: "",
            source: 'onboarding_direct' // Mark as direct onboarding visitor
          }),
        });

        if (contactResponse.ok) {
          console.log('✅ Contact saved to Supabase from onboarding email submit');
        } else {
          const errorText = await contactResponse.text();
          console.warn('⚠️ Failed to save contact to Supabase (non-blocking):', errorText);
          // Continue anyway - don't block the user experience
        }
      } catch (contactError) {
        console.error('Error saving contact from onboarding:', contactError);
        // Continue anyway - don't block the user experience
      }
    } else {
      console.log('ℹ️ Contact already saved from landing page, skipping duplicate save');
    }

    // Create Supabase user if configured
    if (supabase) {
      try {
        // Create user with a temporary random password
        // They'll set their real password on the Business Profile page
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!@';

        console.log('🔐 Creating Supabase user for:', trimmedEmail);

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: tempPassword,
          options: {
            emailRedirectTo: window.location.origin + '/wellness/dashboard',
            data: {
              onboarding_started: true,
              temp_password: true // Flag that this is a temp password
            }
          }
        });

        if (error) {
          console.error('❌ Error creating user:', error);

          // If user already exists, try to sign in
          if (error.message?.includes('already registered') ||
            error.message?.includes('already exists') ||
            error.message?.includes('User already registered')) {
            console.log('ℹ️ User already exists, attempting to sign in...');

            // Try to sign in with the temp password (in case they're returning)
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: tempPassword
            });

            if (signInError) {
              // If sign in fails, try magic link
              console.log('ℹ️ Sign in failed, trying magic link...');
              const { error: otpError } = await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                  emailRedirectTo: window.location.origin + '/wellness/dashboard'
                }
              });

              if (otpError) {
                console.error('Error sending magic link:', otpError);
                // Continue anyway - user creation will be handled on Business Profile page
              } else {
                console.log('✅ Magic link sent to existing user');
              }
            } else if (signInData.user) {
              console.log('✅ Signed in existing user:', signInData.user.id);
            }
          } else {
            // 2. Link contact record to user when password is created
            // This connects the initial form submission to the user account
            if (data.user && answers.email) {
              try {
                const { error: contactError } = await supabase
                  .from('contacts')
                  .update({
                    user_id: data.user.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('email', answers.email.trim().toLowerCase());

                if (contactError) {
                  console.error('Error linking contact to user:', contactError);
                } else {
                  console.log('✅ Linked contact record to user:', data.user.id);
                }
              } catch (contactErr) {
                console.error('Error updating contact:', contactErr);
              }
            }

            // NOTE: Business profiles are NOT created here during onboarding (Status: Step 1)
            // We wait until they complete all questions and set a password (Step 13)

          }
        } else if (data.user) {
          console.log('✅ User created successfully:', data.user.id);
          console.log('📧 Email confirmation required:', data.user.email_confirmed_at ? 'No' : 'Yes');

          // Store temp password in sessionStorage since we successfully created a new user
          // This allows us to re-establish session later if needed
          sessionStorage.setItem('wellness_temp_password', tempPassword);
          console.log('💾 Temp password stored in sessionStorage for new user');

          // User created - try to auto-sign in
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: tempPassword
            });

            if (signInError) {
              console.log('ℹ️ Auto-signin requires email confirmation:', signInError.message);
            } else if (signInData.user) {
              console.log('✅ Auto-signed in new user:', signInData.user.id);
            }
          } catch (signInErr: any) {
            console.log('ℹ️ Auto-signin may require email confirmation:', signInErr.message);
          }
        } else {
          console.warn('⚠️ No user data returned from signUp');
        }
      } catch (err) {
        console.error('Error in email submit:', err);
      }
    }

    // Track Lead event ONLY if user came directly to onboarding (no eventId in URL)
    // If eventId exists, the Lead was already tracked on the landing page
    if (!eventIdFromUrl) {
      // User came directly to onboarding - track Lead event
      const eventId = `lead_${crypto.randomUUID()}`;

      // Track Lead event via Meta Conversions API (server-side)
      try {
        const metaResponse = await fetch(`${API_BASE_URL}/api/track-meta-lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            firstName: trimmedEmail.split('@')[0] || "",
            eventSourceUrl: window.location.href,
            eventId: eventId,
          }),
        });

        if (!metaResponse.ok) {
          console.error("Failed to track lead in Meta Conversions API");
        } else {
          console.log("Lead tracked in Meta Conversions API successfully");
        }
      } catch (metaError) {
        console.error("Error tracking lead in Meta:", metaError);
      }

      // Track Lead event via client-side pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        console.log('[Onboarding] Tracking Lead event on email submit (direct visitor)');
        (window as any).fbq('track', 'Lead', {
          content_name: 'Onboarding Email Submit',
          content_category: 'Lead Generation'
        }, {
          eventID: eventId
        });
      }
    } else {
      console.log('[Onboarding] Skipping Lead tracking - already tracked on landing page');
    }

    // Track email step completion
    const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
    trackOnboardingEvent(1, 'completed', {
      email: trimmedEmail,
      timeSpentSeconds: timeSpent > 0 ? timeSpent : null,
      entryPoint: eventIdFromUrl ? 'landing_page' : 'onboarding_direct',
      source: eventIdFromUrl ? 'wellness' : 'onboarding_direct',
    });

    setIsSubmitting(false);
    // Move to next step (questions)
    setStep(2);
  };

  const nextStep = () => {
    // Step 0: Welcome (optional, can be skipped)
    // Step 1: Email collection
    // Steps 2-10: Questions (9 questions)
    // Step 11: Recommendation Summary
    // Step 12: Identity Form (Legal Entity)
    // Step 13: Contact Details Form → Creates Business Profile → Jumps to Step 17
    // Steps 14-16: REMOVED (CustomizationTransition, WebsiteInputForm, ReviewProgressCard)
    // Step 17: Generated Documents Card
    // Step 18: Lawyer Booking Card
    // Step 19: Password Creation → Dashboard
    if (step === 0) {
      // Move to email collection
      setStep(1);
    } else if (step < 19) {
      setStep(step + 1);
    } else {
      // Finished - go directly to dashboard
      navigate('/wellness/dashboard');
    }
  };

  // Show loading while checking for existing user
  if (isCheckingExistingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
        <div className="max-w-xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Customize Your Wellness Legal Documents
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
            Answer a few quick questions so we can tailor every agreement, waiver, and policy to your specific business.
          </p>

          {/* Feature Bullet Points */}
          <div className="space-y-3 max-w-md mx-auto text-left">
            <div className="flex items-start gap-3 text-slate-700">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mt-0.5">
                <Globe size={14} />
              </div>
              <span className="text-base leading-relaxed">Scan your website compliance</span>
            </div>
            <div className="flex items-start gap-3 text-slate-700">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mt-0.5">
                <Upload size={14} />
              </div>
              <span className="text-base leading-relaxed">Upload current documents for analysis</span>
            </div>
            <div className="flex items-start gap-3 text-slate-700">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mt-0.5">
                <Download size={14} />
              </div>
              <span className="text-base leading-relaxed">Downloadable templates</span>
            </div>
          </div>

          <button
            onClick={nextStep}
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-600 px-8 text-lg font-medium text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 hover:-translate-y-0.5"
          >
            Start Customization
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Email Collection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {hasAutoSubmittedEmail ? 'Setting Up Your Profile...' : "Answer 9 Quick Questions"}
            </h2>
            <p className="text-slate-600">
              {hasAutoSubmittedEmail ? 'Please wait while we prepare your questions.' : (
                <>
                  We’ll instantly tell you what legal documents your business is missing.
                  <div className="mt-1 text-slate-500 text-sm">Takes ~45 seconds.</div>
                </>
              )}
            </p>
          </div>



          {!hasAutoSubmittedEmail ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email address (to save your results)
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && emailInput) {
                        setIsSubmitting(true);
                        handleEmailSubmit(emailInput);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSubmitting(true);
                    handleEmailSubmit(emailInput);
                  }}
                  disabled={!emailInput || isSubmitting}
                  className="w-full h-12 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating account...' : 'Get your customized documents in 45 seconds.'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
          )}
        </div>
      </div >
    );
  }

  // Steps 2-10: Questions (9 questions)
  // Step 11: Recommendation Summary
  // Step 12: Legal Entity Form
  // Step 13: Contact Details
  // Step 14: Transition
  // Step 15: Website
  // Step 16: Password Creation

  // We need to render the password step distinct from renderQuestion because it's not a QuestionCard

  // Step 11: Recommendation Summary
  if (step === 11) {
    console.log('[Onboarding] Step 11 - Recommendation Summary');
    console.log('[Onboarding] Current answers:', answers);

    const { freeTemplates } = getRecommendedDocuments(answers);

    console.log('[Onboarding] freeTemplates received:', freeTemplates);
    console.log('[Onboarding] freeTemplates count:', freeTemplates.length);

    // Sort logic: Core (Waiver, Terms) first
    const priorities = ['template-1', 'template-2', 'template-3'];
    const sorted = [...freeTemplates].sort((a, b) => {
      const aP = priorities.includes(a.id) ? 1 : 0;
      const bP = priorities.includes(b.id) ? 1 : 0;
      return bP - aP;
    });

    console.log('[Onboarding] Sorted recommendations:', sorted);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RecommendationSummary
          recommendations={sorted}
          onContinue={nextStep}
        />
      </div>
    );
  }

  // Step 12: Identity Form (Step A)
  if (step === 12) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <IdentityForm
          answers={answers}
          onUpdate={updateAnswer}
          onNext={nextStep}
          onBack={() => setStep(step - 1)}
        />
      </div>
    );
  }

  // Step 13: Contact Details Form (Step B)
  if (step === 13) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ContactDetailsForm
          answers={answers}
          onUpdate={updateAnswer}
          onNext={async () => {
            // Create profile before moving to docs card specifically to ensure email trigger works
            // The GeneratedDocumentsCard (Step 17) calls an API that requires this profile to exist
            if (supabase) {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await createBusinessProfile(user);
                }
              } catch (e) {
                console.error('Error saving profile before docs:', e);
              }
            }
            // Skip steps 14, 15, 16 and go directly to Generated Documents
            setStep(17);
          }}
          onBack={() => setStep(step - 1)}
        />
      </div>
    );
  }

  // Steps 14, 15, 16 removed: CustomizationTransition, WebsiteInputForm, ReviewProgressCard
  // Flow now goes directly from Contact Details (13) to Generated Documents (17)

  // Step 17: Generated Documents Breakdown
  if (step === 17) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <GeneratedDocumentsCard
          answers={answers}
          onContinue={() => setStep(18)}
          onSkip={() => setStep(19)}
          onGenerate={() => {
            toast({
              title: "Documents Preparing...",
              description: "Your custom documents are being prepared and will be ready in your dashboard.",
            });
          }}
        />
      </div>
    );
  }

  // Step 18: Lawyer Booking
  if (step === 18) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <LawyerBookingCard
          onComplete={() => setStep(19)}
          email={answers.email}
        />
      </div>
    );
  }

  // Step 19: Password Creation (Moved to end)
  if (step === 19) {
    const showPasswordForm = isTempPassword || isUpdatingPassword;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
            <div className="text-center mb-8">
              <div className={`w-12 h-12 ${!isTempPassword ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                {!isTempPassword ? 'Account Secured' : 'Save Your Custom Documents'}
              </h2>
              <p className="text-slate-600">
                {!isTempPassword
                  ? 'Your account is already password protected. Your legal documents will save automatically.'
                  : 'Create a password so you can access, edit, and download your documents anytime.'
                }
              </p>
            </div>

            <div className="space-y-4">
              {!isTempPassword && !isUpdatingPassword && (
                <div className="text-center pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
                    <CheckCircle2 size={16} />
                    Password Active
                  </div>
                  <button
                    onClick={() => setIsUpdatingPassword(true)}
                    className="block w-full text-sm text-brand-600 font-medium hover:underline mb-2"
                  >
                    Update Password (Optional)
                  </button>
                </div>
              )}

              {showPasswordForm && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {isUpdatingPassword ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none pr-10"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none pr-10"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                      <div className="mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-red-600" /></div>
                      {passwordError}
                    </div>
                  )}

                  {isUpdatingPassword && (
                    <button
                      onClick={() => setIsUpdatingPassword(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handlePasswordSubmit}
                disabled={isSubmitting || (showPasswordForm && (!password || !confirmPassword))}
                className="w-full h-12 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? 'Saving...' : (!isTempPassword && !isUpdatingPassword ? 'Continue to Dashboard' : 'Save & Continue')}
              </button>

              {isTempPassword && (
                <button
                  onClick={handleSkipPassword}
                  disabled={isSubmitting}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Skip for now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionIndex = step - 2; // Adjust for email step

  const renderQuestion = () => {
    switch (currentQuestionIndex) {
      case 0:
        return (
          <QuestionCard
            question="Primary Business Type"
            type="single"
            options={['Yoga', 'Pilates', 'Gym', 'Retreats', 'Coaching', 'Breathwork']}
            selected={answers.primaryBusinessType || null}
            onAnswer={(val) => updateAnswer('primaryBusinessType', val)}
            onNext={nextStep}
          // No back button on first question
          />
        );
      case 1:
        return (
          <QuestionCard
            question="What services does your business offer?"
            type="multi"
            options={['Group classes', 'Private 1-on-1 sessions', 'Retreats or workshops', 'Online coaching / digital programs', 'None']}
            selected={answers.services}
            onAnswer={(val) => updateAnswer('services', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 2:
        return (
          <QuestionCard
            question="Do clients participate in physical movement or hands-on activities?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.hasPhysicalMovement}
            onAnswer={(val) => updateAnswer('hasPhysicalMovement', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 3:
        return (
          <QuestionCard
            question="Do you collect payments, bookings, or client information online?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.collectsOnline}
            onAnswer={(val) => updateAnswer('collectsOnline', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 4:
        return (
          <QuestionCard
            question="Do you hire instructors, contractors, staff, or co-facilitators?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.hiresStaff}
            onAnswer={(val) => updateAnswer('hiresStaff', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 5:
        return (
          <QuestionCard
            question="Do you run any events, classes, or retreats off-site or internationally?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.isOffsiteOrInternational}
            onAnswer={(val) => updateAnswer('isOffsiteOrInternational', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 6:
        return (
          <QuestionCard
            question="Do you hire W-2 Employees?"
            subtext="Distinct from independent contractors (1099)."
            type="single"
            options={['Yes', 'No']}
            selected={answers.hasEmployees}
            onAnswer={(val) => updateAnswer('hasEmployees', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 7:
        return (
          <QuestionCard
            question="Do you sell physical products?"
            subtext="Supplements, clothing, equipment, etc."
            type="single"
            options={['Yes', 'No']}
            selected={answers.sellsProducts}
            onAnswer={(val) => updateAnswer('sellsProducts', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
          />
        );
      case 8:
        return (
          <QuestionCard
            question="Do you use client photos or videos?"
            subtext="For social media, website, or marketing."
            type="single"
            options={['Yes', 'No']}
            selected={answers.usesPhotos}
            onAnswer={(val) => updateAnswer('usesPhotos', val)}
            onNext={nextStep}
            onBack={() => setStep(step - 1)}
            isLast={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky progress bar on mobile */}
      {currentQuestionIndex > 0 && (
        <div className="sticky top-0 z-50 bg-slate-50 border-b border-slate-200 px-4 pt-4 pb-3 md:relative md:border-b-0 md:pt-12">
          <div className="w-full max-w-lg mx-auto">
            <div className="flex justify-between text-xs font-semibold uppercase text-slate-400 mb-2">
              <span>Question {step - 1} of 9</span>
              <span>{Math.round(((step - 1) / 9) * 100)}% Complete</span>
            </div>
            <ProgressBar current={step - 1} total={9} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center pt-4 md:pt-12 p-4">
        {currentQuestionIndex === 0 && (
          <div className="w-full max-w-lg text-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Answer 9 Quick Questions</h2>
            <p className="text-slate-600 leading-relaxed">
              We'll instantly tell you what legal documents your business is missing.
              <span className="block mt-1 text-sm font-medium text-emerald-600">Takes ~45 seconds.</span>
            </p>
          </div>
        )}
        {renderQuestion()}
      </div>
    </div>
  );
};
