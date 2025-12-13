import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserAnswers } from '../../types/wellness';
import { ProgressBar } from '../../components/wellness/ui/ProgressBar';
import { QuestionCard } from '../../components/wellness/onboarding/QuestionCard';
import { ShieldCheck, Mail, Globe, Upload, Download, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const INITIAL_ANSWERS: UserAnswers = {
  services: [],
  hasPhysicalMovement: true,
  collectsOnline: true,
  hiresStaff: true,
  isOffsiteOrInternational: true,
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
  const [isTempPassword, setIsTempPassword] = useState(true); // Default to true (assume new user)

  // Password step state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false); // For users who already have a password but want to change it

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
        const { error } = await supabase.auth.updateUser({
          password: password,
          data: { temp_password: false } // Mark as no longer temp
        });

        if (error) throw error;

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
            // 1. Add user to users table (track authenticated users with passwords)
            try {
              console.log('👤 Adding user to users table...');
              const userName = user.user_metadata?.name ||
                               user.user_metadata?.full_name ||
                               user.email?.split('@')[0] ||
                               'User';

              console.log('📝 Attempting upsert with data:', {
                user_id: user.id,
                email: user.email,
                name: userName
              });

              const { data: insertData, error: userTableError } = await supabase
                .from('users')
                .upsert({
                  user_id: user.id,
                  email: user.email || '',
                  name: userName,
                  password_created_at: new Date().toISOString(),
                  onboarding_completed: false,
                  profile_completed: false,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                })
                .select();

              if (userTableError) {
                console.error('❌ CRITICAL: Error adding user to users table:', {
                  error: userTableError,
                  message: userTableError.message,
                  details: userTableError.details,
                  hint: userTableError.hint,
                  code: userTableError.code
                });
                console.log('⚠️ Note: Database trigger should still add user to users table as fallback');
                // Show error to user via toast
                alert(`Warning: User account created but profile setup incomplete. Error: ${userTableError.message}. Please contact support if issues persist.`);
              } else {
                console.log('✅ User added to users table successfully', insertData);
              }

              // Send welcome email when user sets password (regardless of application-level insert success)
              // The database trigger ensures the user is added to the table even if app-level insert fails
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
              }
            } catch (userTableErr) {
              console.error('❌ CRITICAL: Exception in users table insertion:', {
                error: userTableErr,
                message: userTableErr instanceof Error ? userTableErr.message : String(userTableErr),
                stack: userTableErr instanceof Error ? userTableErr.stack : undefined
              });
              console.log('⚠️ Note: Database trigger should still add user to users table as fallback');
              alert(`Warning: An error occurred while setting up your profile. Please contact support. Error: ${userTableErr instanceof Error ? userTableErr.message : String(userTableErr)}`);

              // Still send welcome email - the database trigger should have added the user
              const userName = user.user_metadata?.name ||
                               user.user_metadata?.full_name ||
                               user.email?.split('@')[0] ||
                               'User';
              if (user.email) {
                console.log('📧 Triggering welcome email after password creation (despite error)...');
                fetch('/api/emails/welcome', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: user.email,
                    name: userName
                  })
                }).catch(err => console.error('❌ Welcome email error:', err));
              }
            }

            // 2. Link contact record to user when password is created
            if (user.email) {
              try {
                const { error: contactError } = await supabase
                  .from('contacts')
                  .update({
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('email', user.email.trim().toLowerCase());

                if (contactError) {
                  console.error('Error linking contact to user:', contactError);
                  // Continue anyway - not critical if contact doesn't exist
                } else {
                  console.log('✅ Linked contact record to user:', user.id);
                }
              } catch (contactErr) {
                console.error('Error updating contact:', contactErr);
                // Continue anyway
              }
            }

            // 4. Business profile will be created when user saves their business profile
            // (No longer creating empty business profile here - only when they actually fill it out)
          }
        } catch (postUpdateErr) {
          console.error('❌ Error in post-password operations:', postUpdateErr);
        }

        // Success
        navigate('/wellness/dashboard');
      } catch (err: any) {
        console.error('Error setting password:', err);
        setPasswordError(err.message || 'Failed to update password');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Fallback if no supabase
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

            // 3. Create Business Profile entry
            // This ensures they are added to the table immediately upon account creation
            if (data.user) {
              try {
                console.log('🏗️ Creating initial business profile...');

                // Map Primary Business Type (logic matched from BusinessProfile.tsx)
                let mappedBusinessType = '';
                if (answers.primaryBusinessType) {
                  switch (answers.primaryBusinessType) {
                    case 'Yoga': mappedBusinessType = 'Yoga Studio'; break;
                    case 'Pilates': mappedBusinessType = 'Pilates Studio'; break;
                    case 'Gym': mappedBusinessType = 'Gym / Fitness Studio'; break;
                    case 'Retreats': mappedBusinessType = 'Retreat Leader'; break;
                    case 'Coaching': mappedBusinessType = 'Online Coach'; break;
                    case 'Breathwork': mappedBusinessType = 'Breathwork / Meditation'; break;
                    default: mappedBusinessType = answers.primaryBusinessType;
                  }
                }

                const { error: profileError } = await supabase
                  .from('business_profiles')
                  .upsert({
                    user_id: data.user.id,
                    // We don't have business name yet, will be filled in BusinessProfile
                    business_type: mappedBusinessType,
                    // Onboarding answer fields
                    services: answers.services || [],
                    has_physical_movement: answers.hasPhysicalMovement ?? false,
                    collects_online: answers.collectsOnline ?? false,
                    hires_staff: answers.hiresStaff ?? false,
                    is_offsite_or_international: answers.isOffsiteOrInternational ?? false,
                    has_w2_employees: answers.hasEmployees ?? false,
                    sells_products: answers.sellsProducts ?? false,
                    updated_at: new Date().toISOString()
                  }, {
                    onConflict: 'user_id'
                  });

                if (profileError) {
                  console.error('❌ Error creating initial business profile:', profileError);
                  // Non-blocking error
                } else {
                  console.log('✅ Initial business profile created successfully');
                }
              } catch (profileErr) {
                console.error('❌ Error in business profile creation:', profileErr);
              }
            }
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

          // Email sending moved to Password Creation step (handlePasswordSubmit)
          // to ensure user has actually set a password before we welcome them.

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
    // Steps 2-7: Questions (6 questions)
    if (step === 0) {
      // Move to email collection
      setStep(1);
    } else if (step < 8) { // 1 is email, 2-7 are questions, 8 is password
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

  // Steps 2-9: Questions (8 questions)
  // Step 8 (index 6): W-2 (Unused) -> we want to skip or ensure we reach renders
  // Actually, let's redefine the flow:
  // Step 2-7 are the 6 visible questions.
  // Step 8 is the Password Step.

  // We need to render the password step distinct from renderQuestion because it's not a QuestionCard

  // Step 8: Password Creation
  // Step 8: Password Creation
  if (step === 8) {
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
                {!isTempPassword ? 'Account Secured' : 'Secure Your Account'}
              </h2>
              <p className="text-slate-600">
                {!isTempPassword
                  ? 'Your account is already password protected. Your legal documents will save automatically.'
                  : 'If you want your customized legal documents to save, create a password.'
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
                  onClick={() => navigate('/wellness/dashboard')}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Steps 2-9: Questions (8 questions)
  // Step 8 is Password Creation (handled above)
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
            isLast={false}
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
          <span>Question {step - 1} of 6</span>
          <span>{Math.round(((step - 1) / 6) * 100)}% Complete</span>
        </div>
        <ProgressBar current={step - 1} total={6} />
      </div>
      {renderQuestion()}
    </div>
  );
};
