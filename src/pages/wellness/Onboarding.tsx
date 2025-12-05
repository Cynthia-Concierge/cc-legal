import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserAnswers } from '../../types/wellness';
import { ProgressBar } from '../../components/wellness/ui/ProgressBar';
import { QuestionCard } from '../../components/wellness/onboarding/QuestionCard';
import { ShieldCheck, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const INITIAL_ANSWERS: UserAnswers = {
  services: [],
  hasPhysicalMovement: false,
  collectsOnline: false,
  hiresStaff: false,
  isOffsiteOrInternational: false,
};

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Initialize step to 1 if skipWelcome is true, otherwise 0
  // Check URL directly to avoid hook dependency in initializer
  const [step, setStep] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('skipWelcome') === 'true' ? 1 : 0;
  });
  const [answers, setAnswers] = useState<UserAnswers>(INITIAL_ANSWERS);
  // Email step state - must be at top level (Rules of Hooks)
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingExistingUser, setIsCheckingExistingUser] = useState(true);

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
          // Required fields: services (array with items), and all 4 boolean questions
          const hasServices = parsed.services && Array.isArray(parsed.services) && parsed.services.length > 0;
          const hasAllBooleans = typeof parsed.hasPhysicalMovement === 'boolean' &&
                                 typeof parsed.collectsOnline === 'boolean' &&
                                 typeof parsed.hiresStaff === 'boolean' &&
                                 typeof parsed.isOffsiteOrInternational === 'boolean';
          const hasCompletedOnboarding = hasServices && hasAllBooleans;
          
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
              console.log('[Onboarding] Session check:', { 
                hasActiveSession, 
                userId: session?.user?.id,
                onboardingCompleteInMetadata,
                hasPassword: hasActiveSession // If they have a session, they have a password
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

  const handleEmailSubmit = async (email: string) => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();
    
    // Save email to answers
    updateAnswer('email', trimmedEmail);

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
            // Other error - log it but continue
            console.error('Error details:', {
              message: error.message,
              status: error.status
            });
            // Continue anyway - we'll try to create user on Business Profile page
          }
        } else if (data.user) {
          console.log('✅ User created successfully:', data.user.id);
          console.log('📧 Email confirmation required:', data.user.email_confirmed_at ? 'No' : 'Yes');
          
          // User created - try to auto-sign in (may require email confirmation depending on Supabase settings)
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: tempPassword
            });
            
            if (signInError) {
              // May require email confirmation - that's okay, user can set password on profile page
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
      } catch (err: any) {
        console.error('❌ Error in user creation:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack
        });
        // Continue anyway - user can set password on Business Profile
      }
    } else {
      console.warn('⚠️ Supabase not configured - user will not be created in Supabase');
    }

    setIsSubmitting(false);
    // Move to next step (questions)
    setStep(2);
  };

  const nextStep = () => {
    // Step 0: Welcome
    // Step 1: Email collection (handled separately)
    // Steps 2-6: Questions (5 questions)
    if (step === 0) {
      // Move to email collection
      setStep(1);
    } else if (step < 6) { // 1 is email, 2-6 are questions
      setStep(step + 1);
    } else {
      // Finished - go directly to dashboard (Business Profile is optional and can be accessed later)
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
            <h2 className="text-2xl font-semibold text-slate-900">Let's Get Started</h2>
            <p className="text-slate-600">Enter your email to begin your assessment</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
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
                {isSubmitting ? 'Creating account...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Steps 2-6: Questions (5 questions)
  const totalSteps = 6; // 1 email + 5 questions
  const currentQuestionIndex = step - 2; // Adjust for email step

  const renderQuestion = () => {
    switch (currentQuestionIndex) {
      case 0:
        return (
          <QuestionCard
            question="What services does your business offer?"
            type="multi"
            options={['Group classes', 'Private 1-on-1 sessions', 'Retreats or workshops', 'Online coaching / digital programs', 'None']}
            selected={answers.services}
            onAnswer={(val) => updateAnswer('services', val)}
            onNext={nextStep}
          />
        );
      case 1:
        return (
          <QuestionCard
            question="Do clients participate in physical movement or hands-on activities?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.hasPhysicalMovement}
            onAnswer={(val) => updateAnswer('hasPhysicalMovement', val)}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <QuestionCard
            question="Do you collect payments, bookings, or client information online?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.collectsOnline}
            onAnswer={(val) => updateAnswer('collectsOnline', val)}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <QuestionCard
            question="Do you hire instructors, contractors, staff, or co-facilitators?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.hiresStaff}
            onAnswer={(val) => updateAnswer('hiresStaff', val)}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <QuestionCard
            question="Do you run any events, classes, or retreats off-site or internationally?"
            type="single"
            options={['Yes', 'No']}
            selected={answers.isOffsiteOrInternational}
            onAnswer={(val) => updateAnswer('isOffsiteOrInternational', val)}
            onNext={nextStep}
            isLast={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-12 p-4">
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between text-xs font-semibold uppercase text-slate-400 mb-2">
          <span>Question {step - 1} of 5</span>
          <span>{Math.round(((step - 1) / 5) * 100)}% Complete</span>
        </div>
        <ProgressBar current={step - 1} total={5} />
      </div>
      {renderQuestion()}
    </div>
  );
};
