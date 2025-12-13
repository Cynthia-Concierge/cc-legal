import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAnswers, BusinessType, StaffCount, ClientCount, PrimaryConcern, EntityType } from '../../types/wellness';
import { Button } from '../../components/wellness/ui/Button';
import { ArrowLeft, Store, Users, Target, Building2, Lock, FileText, CheckCircle2, ChevronRight, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';

type SectionId = 'security' | 'identity' | 'legal' | 'structure' | 'risk' | 'goal';

interface SectionConfig {
  id: SectionId;
  title: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'security', title: 'Account Security', icon: Lock, description: 'Secure your account' },
  { id: 'identity', title: 'Business Identity', icon: Store, description: 'Basic business details' },
  { id: 'legal', title: 'Legal Entity', icon: FileText, description: 'Official entity info' },
  { id: 'structure', title: 'Structure & Scale', icon: Building2, description: 'Size and type' },
  { id: 'risk', title: 'Risk Profile', icon: Target, description: 'Activities & liability' },
  { id: 'goal', title: 'Primary Goal', icon: CheckCircle2, description: 'What matters most' },
];

export const BusinessProfile = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('security');

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    website: '',
    instagram: '',
    businessType: '' as BusinessType,
    staffCount: '' as StaffCount,
    clientCount: '' as ClientCount,
    usesPhotos: false,
    primaryConcern: '' as PrimaryConcern,
    // Phase 7 Fields
    hostsRetreats: false,
    offersOnlineCourses: false,
    hasEmployees: false,
    sellsProducts: false,
    // Legal Entity Fields (for document auto-fill)
    legalEntityName: '',
    entityType: '' as EntityType,
    state: '',
    businessAddress: '',
    ownerName: '',
    phone: '',
  });

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      // First, try to load from localStorage (for backward compatibility)
      const saved = localStorage.getItem('wellness_onboarding_answers');
      let parsedAnswers: UserAnswers | null = null;

      if (saved) {
        try {
          parsedAnswers = JSON.parse(saved);
          setAnswers(parsedAnswers);
          // Map Primary Business Type from Onboarding to Profile Business Type
          let mappedBusinessType = parsedAnswers?.businessType || '';
          if (!mappedBusinessType && parsedAnswers?.primaryBusinessType) {
            switch (parsedAnswers.primaryBusinessType) {
              case 'Yoga': mappedBusinessType = 'Yoga Studio'; break;
              case 'Pilates': mappedBusinessType = 'Pilates Studio'; break;
              case 'Gym': mappedBusinessType = 'Gym / Fitness Studio'; break;
              case 'Retreats': mappedBusinessType = 'Retreat Leader'; break;
              case 'Coaching': mappedBusinessType = 'Online Coach'; break;
              case 'Breathwork': mappedBusinessType = 'Breathwork / Meditation'; break;
            }
          }

          // Smart Map: Hosts Retreats
          // True if: Type is Retreats OR Services has Retreats OR isOffsiteOrInternational is true
          const mappedHostsRetreats = parsedAnswers?.hostsRetreats ||
            (parsedAnswers?.primaryBusinessType === 'Retreats') ||
            (parsedAnswers?.services?.includes('Retreats or workshops')) ||
            (parsedAnswers?.isOffsiteOrInternational) ||
            false;

          // Smart Map: Online Courses
          // True if: Type is Coaching OR Services has Online coaching
          const mappedOffersOnlineCourses = parsedAnswers?.offersOnlineCourses ||
            (parsedAnswers?.primaryBusinessType === 'Coaching') ||
            (parsedAnswers?.services?.includes('Online coaching / digital programs')) ||
            false;

          setFormData(prev => ({
            ...prev,
            businessName: parsedAnswers?.businessName || '',
            website: parsedAnswers?.website || '',
            instagram: parsedAnswers?.instagram || '',
            businessType: mappedBusinessType as BusinessType,
            staffCount: parsedAnswers?.staffCount || (parsedAnswers?.hiresStaff ? '1-3' : '0'),
            clientCount: parsedAnswers?.clientCount || '0-20',
            usesPhotos: parsedAnswers?.usesPhotos || false,
            primaryConcern: parsedAnswers?.primaryConcern || '',
            // Phase 7: Load new fields with smart mapping
            hostsRetreats: mappedHostsRetreats,
            offersOnlineCourses: mappedOffersOnlineCourses,
            hasEmployees: parsedAnswers?.hasEmployees || false,
            sellsProducts: parsedAnswers?.sellsProducts || false,
          }));
        } catch (e) {
          console.error("Failed to parse saved answers");
        }
      }

      // If Supabase is configured and user is logged in, load from database
      if (supabase) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (authUser) {
            setHasExistingAccount(true);

            // Should we skip the password section if they already have an account?
            // Maybe not, allowing them to change it is good. 
            // But we might want to default activeSection to 'identity' if they are logged in.
            if (authUser.email_confirmed_at || authUser.last_sign_in_at) {
              setActiveSection('identity');
            }

            console.log('🔍 Loading profile data from Supabase for user:', authUser.id);

            // Load business profile data
            const { data: profileData, error: profileError } = await supabase
              .from('business_profiles')
              .select('*')
              .eq('user_id', authUser.id)
              .single();

            if (!profileError && profileData) {
              console.log('✅ Loaded business profile from Supabase:', profileData);
              // Override form data with Supabase data (more authoritative)
              setFormData(prev => ({
                ...prev,
                businessName: profileData.business_name || prev.businessName,
                website: profileData.website_url || prev.website,
                instagram: profileData.instagram || prev.instagram,
                businessType: profileData.business_type || prev.businessType,
                staffCount: profileData.team_size || prev.staffCount,
                clientCount: profileData.monthly_clients || prev.clientCount,
                usesPhotos: profileData.uses_photos ?? prev.usesPhotos,
                primaryConcern: profileData.primary_concern || prev.primaryConcern,
                // Phase 7 fields
                hostsRetreats: profileData.hosts_retreats ?? prev.hostsRetreats,
                offersOnlineCourses: profileData.offers_online_courses ?? prev.offersOnlineCourses,
                hasEmployees: profileData.has_w2_employees ?? prev.hasEmployees,
                sellsProducts: profileData.sells_products ?? prev.sellsProducts,
                // Legal Entity fields
                legalEntityName: profileData.legal_entity_name || prev.legalEntityName,
                entityType: profileData.entity_type || prev.entityType,
                state: profileData.state || prev.state,
                businessAddress: profileData.business_address || prev.businessAddress,
                ownerName: profileData.owner_name || prev.ownerName,
                phone: profileData.phone || prev.phone,
              }));

              // Also update answers with onboarding data from database if available
              if (profileData.services || profileData.has_physical_movement !== null) {
                setAnswers(prev => prev ? ({
                  ...prev,
                  services: profileData.services || prev.services,
                  hasPhysicalMovement: profileData.has_physical_movement ?? prev.hasPhysicalMovement,
                  collectsOnline: profileData.collects_online ?? prev.collectsOnline,
                  hiresStaff: profileData.hires_staff ?? prev.hiresStaff,
                  isOffsiteOrInternational: profileData.is_offsite_or_international ?? prev.isOffsiteOrInternational,
                }) : prev);
              }
            } else if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error loading profile:', profileError);
            }
          }
        } catch (err) {
          console.error('Error loading from Supabase:', err);
          // Continue with localStorage data
        }
      }

      // If no data at all, redirect to onboarding
      if (!saved && !parsedAnswers) {
        navigate('/wellness/onboarding');
      }
    };

    loadProfileData();
  }, [navigate]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { toast } = useToast();

  const handleSave = async () => {
    if (!answers) return;

    // Validate password if provided
    if (password.trim().length > 0) {
      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Passwords do not match",
          description: "Please ensure both password fields match.",
        });
        return;
      }

      if (password.length < 8) {
        toast({
          variant: "destructive",
          title: "Password too short",
          description: "Password must be at least 8 characters long.",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      let user = null;

      // Only use Supabase if it's configured
      if (supabase) {
        console.log('🔍 Checking for existing Supabase user...');

        // Get current user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !authUser) {
          console.log('ℹ️ No existing user found, creating new user...');

          // User doesn't exist yet - create one if we have email
          const userEmail = answers.email;

          if (!userEmail || !userEmail.includes('@')) {
            console.error('❌ No valid email found to create user');
            toast({
              variant: "destructive",
              title: "Email missing",
              description: "Email is required to create your account. Please go back and enter your email.",
            });
            setIsSaving(false);
            return;
          }

          try {
            // Create user with temporary password (they'll set real one below)
            const tempPassword = Math.random().toString(36).slice(-12) + 'A1!@'; // Random password
            console.log('🔐 Creating Supabase user for:', userEmail);

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: userEmail,
              password: tempPassword,
              options: {
                data: {
                  onboarding_complete: false
                }
              }
            });

            if (signUpError) {
              console.error('❌ Error creating user:', signUpError);

              // User might already exist - try to sign in
              if (signUpError.message?.includes('already registered') ||
                signUpError.message?.includes('already exists') ||
                signUpError.message?.includes('User already registered')) {
                console.log('ℹ️ User already exists, attempting to sign in...');

                // Try to sign in with magic link
                const { error: otpError } = await supabase.auth.signInWithOtp({
                  email: userEmail,
                  options: {
                    emailRedirectTo: window.location.origin + '/wellness/dashboard'
                  }
                });

                if (otpError) {
                  console.error('Error signing in existing user:', otpError);
                  toast({
                    variant: "destructive",
                    title: "Authentication Error",
                    description: "Account exists but could not sign in. Please use the login page.",
                  });
                  setIsSaving(false);
                  return;
                } else {
                  // Get the user after OTP
                  const { data: { user: otpUser } } = await supabase.auth.getUser();
                  if (otpUser) {
                    user = otpUser;
                    console.log('✅ Signed in existing user:', otpUser.id);
                  }
                }
              } else {
                console.error('Error details:', {
                  message: signUpError.message,
                  status: signUpError.status
                });
                toast({
                  variant: "destructive",
                  title: "Account Creation Failed",
                  description: signUpError.message,
                });
                setIsSaving(false);
                return;
              }
            } else if (signUpData.user) {
              user = signUpData.user;
              console.log('✅ User created successfully:', signUpData.user.id);

              // Auto-sign in the newly created user
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: tempPassword
              });

              if (signInError) {
                console.error('Error signing in new user:', signInError);
                console.log('ℹ️ User created but sign-in may require email confirmation');
              } else if (signInData.user) {
                console.log('✅ Auto-signed in new user:', signInData.user.id);
                user = signInData.user; // Update user reference
              }
            } else {
              console.warn('⚠️ No user data returned from signUp');
              toast({
                variant: "destructive",
                title: "Verification Required",
                description: "User account created but could not be verified. Please try logging in.",
              });
              setIsSaving(false);
              return;
            }
          } catch (createErr: any) {
            console.error('❌ Error in user creation flow:', createErr);
            toast({
              variant: "destructive",
              title: "Error",
              description: createErr.message || 'Unknown error during account creation.',
            });
            setIsSaving(false);
            return;
          }
        } else {
          user = authUser;
          console.log('✅ Found existing user:', authUser.id);
        }

        // If we have a user (newly created or existing), update password and metadata
        if (user) {
          // 1. Update password if provided
          if (password.trim().length > 0) {
            const { error: passError } = await supabase.auth.updateUser({
              password: password
            });

            if (passError) {
              console.error('Error setting password:', passError);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to set password. Please try again.",
              });
              setIsSaving(false);
              return;
            }

            // 2. Add user to users table (track authenticated users with passwords)
            try {
              console.log('👤 Adding user to users table...');
              const userName = user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                answers.email?.split('@')[0] ||
                user.email?.split('@')[0] ||
                'User';

              const { error: userTableError } = await supabase
                .from('users')
                .upsert({
                  user_id: user.id,
                  email: user.email || answers.email || '',
                  name: userName,
                  password_created_at: new Date().toISOString(),
                  onboarding_completed: false,
                  profile_completed: false,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                });

              if (userTableError) {
                console.error('❌ Error adding user to users table:', userTableError);
                // Continue anyway - not critical
              } else {
                console.log('✅ User added to users table successfully');

                // Send welcome email when user is added to users table (becomes authenticated user)
                if (user.email) {
                  console.log('📧 Triggering welcome email after password creation...');
                  fetch('/api/emails/welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: user.email,
                      name: userName || user.email.split('@')[0] // Use the name we determined above
                    })
                  }).catch(err => console.error('❌ Welcome email error:', err));
                }
              }
            } catch (userTableErr) {
              console.error('❌ Error in users table insertion:', userTableErr);
              // Continue anyway
            }

            // 3. Link contact record to user when password is created
            // This connects the initial form submission to the user account
            if (answers.email) {
              try {
                const { error: contactError } = await supabase
                  .from('contacts')
                  .update({
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('email', answers.email.trim().toLowerCase());

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
          }

          // 4. Mark onboarding complete
          const { error: updateError } = await supabase.auth.updateUser({
            data: { onboarding_complete: true }
          });

          if (updateError) {
            console.error('Error updating user data:', updateError);
            // Continue anyway - this is not critical
          }

          // Also update users table
          if (user) {
            try {
              const { error: userOnboardingError } = await supabase
                .from('users')
                .update({
                  onboarding_completed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

              if (userOnboardingError) {
                console.error('Error updating users table onboarding status:', userOnboardingError);
                // Continue anyway
              } else {
                console.log('✅ Updated users table: onboarding_completed = true');
              }
            } catch (userOnboardingErr) {
              console.error('Error updating users table:', userOnboardingErr);
              // Continue anyway
            }
          }
        }
      } else {
        // Supabase not configured - show helpful message if password was provided
        if (password.trim().length > 0) {
          const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
          const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

          let errorMsg = 'Supabase is not configured. ';
          if (!hasUrl && !hasKey) {
            errorMsg += 'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.';
          } else if (!hasUrl) {
            errorMsg += 'VITE_SUPABASE_URL is missing from your .env file.';
          } else if (!hasKey) {
            errorMsg += 'VITE_SUPABASE_ANON_KEY is missing from your .env file.';
          } else {
            errorMsg += 'Variables are set but Supabase client failed to initialize. Check the console for details.';
          }
          errorMsg += '\\n\\nNote: After adding variables, restart your dev server (npm run dev).';

          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Supabase is not configured correctly. Check console for details.",
          });
          console.error('Supabase config check:', {
            hasUrl,
            hasKey,
            urlValue: hasUrl ? import.meta.env.VITE_SUPABASE_URL.substring(0, 20) + '...' : 'missing',
            keyValue: hasKey ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'missing'
          });
        }
      }

      // 3. Save business profile to localStorage (existing behavior)
      const updatedAnswers: UserAnswers = {
        ...answers,
        ...formData,
        isProfileComplete: true
      };

      localStorage.setItem('wellness_onboarding_answers', JSON.stringify(updatedAnswers));

      // 4. Save to Supabase business_profiles table ONLY if business name is provided
      // This ensures we only create business profiles when user has actually filled out their business info
      // Users are added to 'users' table when they create password, but business_profiles only when they save profile
      if (user && supabase && formData.businessName && formData.businessName.trim().length > 0) {
        try {
          const { error: profileError } = await supabase
            .from('business_profiles')
            .upsert({
              user_id: user.id,
              business_name: formData.businessName.trim(),
              website_url: formData.website,
              instagram: formData.instagram,
              business_type: formData.businessType,
              team_size: formData.staffCount,
              monthly_clients: formData.clientCount,
              uses_photos: formData.usesPhotos,
              primary_concern: formData.primaryConcern,
              // Phase 7 fields
              hosts_retreats: formData.hostsRetreats,
              offers_online_courses: formData.offersOnlineCourses,
              has_w2_employees: formData.hasEmployees,
              sells_products: formData.sellsProducts,
              // Onboarding answer fields
              services: answers.services || [],
              has_physical_movement: answers.hasPhysicalMovement ?? false,
              collects_online: answers.collectsOnline ?? false,
              hires_staff: answers.hiresStaff ?? false,
              is_offsite_or_international: answers.isOffsiteOrInternational ?? false,
              // Legal Entity fields
              legal_entity_name: formData.legalEntityName,
              entity_type: formData.entityType,
              state: formData.state,
              business_address: formData.businessAddress,
              owner_name: formData.ownerName,
              phone: formData.phone,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (profileError) {
            console.error('Error saving profile to Supabase:', profileError);
            // Continue anyway - localStorage is the primary storage
          } else {
            // Update users table to mark profile as completed
            if (user) {
              try {
                const { error: userUpdateError } = await supabase
                  .from('users')
                  .update({
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);

                if (userUpdateError) {
                  console.error('Error updating users table:', userUpdateError);
                  // Continue anyway - not critical
                } else {
                  console.log('✅ Updated users table: profile_completed = true');
                }
              } catch (userUpdateErr) {
                console.error('Error updating users table:', userUpdateErr);
                // Continue anyway
              }
            }

            // Profile saved successfully - tag in GoHighLevel
            console.log('✅ Business profile saved, tagging in GoHighLevel...');

            // Call backend to add "created business profile" tag in GoHighLevel AND sync all profile data
            if (answers.email) {
              try {
                const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

                // Prepare complete profile data to send
                const completeProfileData = {
                  // Business profile form data
                  ...formData,
                  // Original onboarding answers
                  services: answers.services,
                  hasPhysicalMovement: answers.hasPhysicalMovement,
                  collectsOnline: answers.collectsOnline,
                  hiresStaff: answers.hiresStaff,
                  isOffsiteOrInternational: answers.isOffsiteOrInternational,
                };

                const tagResponse = await fetch(`${serverUrl}/api/add-ghl-business-profile-tag`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: answers.email,
                    profileData: completeProfileData,
                  }),
                });

                if (tagResponse.ok) {
                  const tagResult = await tagResponse.json();
                  console.log('✅ Successfully tagged in GoHighLevel:', tagResult);
                } else {
                  const tagError = await tagResponse.json();
                  console.error('❌ Error tagging in GoHighLevel:', tagError);
                  // Continue anyway - profile save was successful
                }
              } catch (tagErr) {
                console.error('❌ Error calling GHL tag endpoint:', tagErr);
                // Continue anyway - profile save was successful
              }
            }

            // Schedule Website Scan Reminder Email (24h later)
            if (user && answers.email) {
              try {
                const userName = formData.ownerName ||
                  user.user_metadata?.name ||
                  user.user_metadata?.full_name ||
                  answers.email.split('@')[0];

                console.log('📧 Scheduling website scan reminder email...');
                fetch('/api/emails/schedule-website-scan-reminder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.id,
                    email: answers.email,
                    name: userName
                  })
                }).then(res => res.json())
                  .then(data => console.log('✅ Scheduled reminder:', data))
                  .catch(err => console.error('❌ Error scheduling reminder:', err));
              } catch (scheduleErr) {
                console.error('❌ Error in scheduling flow:', scheduleErr);
              }
            }
          }
        } catch (profileErr) {
          console.error('Error saving profile:', profileErr);
          // Continue anyway
        }
      }

      if (password.trim().length > 0) {
        toast({
          title: "Profile Saved & Password Set",
          description: "Your business profile is updated and your password is now active.",
          className: "bg-green-50 border-green-200 text-green-900",
        });
      } else {
        toast({
          title: "Profile Saved Successfully",
          description: "Your business details have been updated.",
          className: "bg-green-50 border-green-200 text-green-900",
        });
      }

      // Add a small delay so user can see the success toast before redirect
      setTimeout(() => {
        navigate('/wellness/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsSaving(false);
    }
  };

  const nextSection = () => {
    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
    if (currentIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSection = () => {
    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(SECTIONS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!answers) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/wellness/dashboard')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={18} />
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            <h1 className="text-xl font-semibold text-slate-900">Business Profile</h1>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save & Exit'}
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Sections</p>
            </div>
            <nav className="flex flex-col">
              {SECTIONS.map((section, idx) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                        w-full flex items-center gap-3 p-4 text-left transition-colors border-l-4
                        ${isActive
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'}
                      `}
                  >
                    <Icon size={20} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{section.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{section.description}</p>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-brand-400" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[500px] animate-in fade-in zoom-in-95 duration-300">

            {/* Section Header */}
            <div className="mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                {(() => {
                  const s = SECTIONS.find(x => x.id === activeSection);
                  const Icon = s?.icon || Store;
                  return (
                    <>
                      <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                        <Icon size={24} />
                      </div>
                      {s?.title}
                    </>
                  );
                })()}
              </h2>
              <p className="text-slate-500 mt-2 ml-14">
                {SECTIONS.find(x => x.id === activeSection)?.description}
              </p>
            </div>

            {/* Section Content */}
            <div className="space-y-6">

              {activeSection === 'security' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  {/* For existing users who haven't clicked 'Change Password' yet, show a secured state */}
                  {hasExistingAccount && !showChangePassword ? (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-full border border-green-100 shadow-sm text-green-600">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Account Secured</h3>
                          <p className="text-green-700 mt-1 max-w-md">
                            Your account is currently protected with a password. You don't need to do anything here unless you want to change it.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePassword(true)}
                        className="whitespace-nowrap bg-white hover:bg-green-100 hover:text-green-900 border-green-200"
                      >
                        Change Password
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                        <Lock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="font-medium text-blue-900">
                            {hasExistingAccount ? 'Change Your Password' : 'Protect Your Documents'}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {hasExistingAccount
                              ? 'Enter a new password below to update your login credentials.'
                              : 'Setting a strong password ensures only you can access your generated legal agreements.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            {hasExistingAccount ? 'New Password' : 'Create Password'}
                          </label>
                          <input
                            type="password"
                            placeholder="At least 8 characters"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                          <input
                            type="password"
                            placeholder="Re-enter your password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Password validation messages */}
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-red-500 flex items-center gap-2"><CheckCircle2 size={14} className="opacity-0" /> Passwords do not match.</p>
                      )}
                      {password && password.length > 0 && password.length < 8 && (
                        <p className="text-sm text-red-500">Password must be at least 8 characters.</p>
                      )}

                      {/* Cancel button for existing users */}
                      {hasExistingAccount && (
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              setShowChangePassword(false);
                              setPassword('');
                              setConfirmPassword('');
                            }}
                            className="text-sm text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'identity' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Zen Yoga Studio"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                      <input
                        type="text"
                        placeholder="yourbusiness.com"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Instagram Handle <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="@yourhandle"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.instagram}
                        onChange={(e) => handleChange('instagram', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'legal' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    This information is used to <strong>auto-fill your legal documents</strong>. Fill this out once to generate personalized agreements instantly.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Legal Entity Name <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zen Yoga LLC"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.legalEntityName}
                        onChange={(e) => handleChange('legalEntityName', e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">Official registered business name</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Entity Type <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.entityType}
                        onChange={(e) => handleChange('entityType', e.target.value)}
                      >
                        <option value="">Select type...</option>
                        <option value="LLC">LLC</option>
                        <option value="Corporation">Corporation</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Owner/Representative Name <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.ownerName}
                        onChange={(e) => handleChange('ownerName', e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">Legal signer on documents</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Business Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main St, San Francisco, CA 94102"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      value={formData.businessAddress}
                      onChange={(e) => handleChange('businessAddress', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Physical address for legal notices</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="California"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">State of formation/operation</p>
                  </div>
                </div>
              )}

              {activeSection === 'structure' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Primary Business Type</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                      value={formData.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value)}
                    >
                      <option value="">Select a type...</option>
                      <option value="Yoga Studio">Yoga Studio</option>
                      <option value="Pilates Studio">Pilates Studio</option>
                      <option value="Gym / Fitness Studio">Gym / Fitness Studio</option>
                      <option value="Retreat Leader">Retreat Leader</option>
                      <option value="Online Coach">Online Coach</option>
                      <option value="Personal Trainer">Personal Trainer</option>
                      <option value="Wellness Practitioner">Wellness Practitioner</option>
                      <option value="Breathwork / Meditation">Breathwork / Meditation</option>
                      <option value="Hybrid (Online + In-person)">Hybrid (Online + In-person)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Team Size</label>
                      <div className="flex flex-wrap gap-2">
                        {['0', '1-3', '4-10', '10+'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleChange('staffCount', opt)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.staffCount === opt
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Clients</label>
                      <div className="flex flex-wrap gap-2">
                        {['0-20', '20-50', '50-200', '200+'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleChange('clientCount', opt)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.clientCount === opt
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'risk' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                    <div>
                      <p className="font-medium text-slate-900">Do you use client photos or videos?</p>
                      <p className="text-xs text-slate-500">For social media, website, or marketing materials.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChange('usesPhotos', true)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.usesPhotos ? 'bg-brand-600 text-white' : 'bg-white border text-slate-600'}`}
                      >Yes</button>
                      <button
                        onClick={() => handleChange('usesPhotos', false)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!formData.usesPhotos ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}
                      >No</button>
                    </div>
                  </div>

                  {[
                    {
                      key: 'hostsRetreats',
                      label: 'Do you host retreats or travel events?',
                      sub: 'Includes local day-retreats or international trips.'
                    },
                    {
                      key: 'offersOnlineCourses',
                      label: 'Do you sell online courses or digital memberships?',
                      sub: 'Includes pre-recorded videos, PDFs, or subscription apps.'
                    },
                    {
                      key: 'hasEmployees',
                      label: 'Do you hire W-2 Employees?',
                      sub: 'Distinct from independent contractors (1099).'
                    },
                    {
                      key: 'sellsProducts',
                      label: 'Do you sell physical products?',
                      sub: 'Supplements, clothing, equipment, etc.'
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.sub}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChange(item.key, true)}
                          // @ts-ignore
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData[item.key] ? 'bg-brand-600 text-white' : 'bg-white border text-slate-600'}`}
                        >Yes</button>
                        <button
                          onClick={() => handleChange(item.key, false)}
                          // @ts-ignore
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!formData[item.key] ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}
                        >No</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'goal' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Which of these feels most urgent right now?</label>
                  <div className="grid gap-3">
                    {[
                      "I'm not sure what documents I need",
                      'I want to protect myself from liability',
                      'I want to protect my website + online content',
                      'I want to legally protect my staff/contractors',
                      'I run retreats and need to protect myself',
                      'I want to protect my brand (IP/trademark)',
                      'Everything feels overwhelming — I need guidance'
                    ].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleChange('primaryConcern', opt)}
                        className={`
                              w-full text-left p-4 rounded-xl border transition-all text-sm flex items-center gap-3
                              ${formData.primaryConcern === opt
                            ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-brand-200'}
                            `}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.primaryConcern === opt ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                          {formData.primaryConcern === opt && <CheckCircle2 size={12} />}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={prevSection}
                disabled={activeSection === SECTIONS[0].id}
                className={activeSection === SECTIONS[0].id ? 'invisible' : ''}
              >
                Back
              </Button>

              {activeSection !== SECTIONS[SECTIONS.length - 1].id ? (
                <Button onClick={nextSection} className="flex items-center gap-2">
                  Next Step <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving || !formData.businessName} className="flex items-center gap-2">
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Complete Profile'}
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
