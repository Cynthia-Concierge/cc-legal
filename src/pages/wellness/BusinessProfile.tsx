import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAnswers, BusinessType, StaffCount, ClientCount, PrimaryConcern } from '../../types/wellness';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/wellness/ui/Card';
import { Button } from '../../components/wellness/ui/Button';
import { ArrowLeft, Store, Users, Target, Building2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const BusinessProfile = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<UserAnswers | null>(null);

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
  });

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      // First, try to load from localStorage (for backward compatibility)
      const saved = localStorage.getItem('wellness_onboarding_answers');
      let parsedAnswers: UserAnswers | null = null;
      
      if (saved) {
        try {
          parsedAnswers = JSON.parse(saved);
          setAnswers(parsedAnswers);
          setFormData(prev => ({
            ...prev,
            businessName: parsedAnswers?.businessName || '',
            website: parsedAnswers?.website || '',
            instagram: parsedAnswers?.instagram || '',
            businessType: parsedAnswers?.businessType || '',
            staffCount: parsedAnswers?.staffCount || (parsedAnswers?.hiresStaff ? '1-3' : '0'),
            clientCount: parsedAnswers?.clientCount || '0-20',
            usesPhotos: parsedAnswers?.usesPhotos || false,
            primaryConcern: parsedAnswers?.primaryConcern || '',
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
              }));
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

  const handleSave = async () => {
    if (!answers) return;

    // Validate password if provided
    if (password.trim().length > 0) {
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      if (password.length < 8) {
        alert('Password must be at least 8 characters.');
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
            alert('Email is required to create your account. Please go back and enter your email.');
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
                  alert('Account exists but could not sign in. Please use the login page.');
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
                alert('Error creating account: ' + signUpError.message);
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
              alert('User account created but could not be verified. Please try logging in.');
              setIsSaving(false);
              return;
            }
          } catch (createErr: any) {
            console.error('❌ Error in user creation flow:', createErr);
            alert('Error creating account: ' + (createErr.message || 'Unknown error'));
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
              alert('Error setting password. Please try again.');
              setIsSaving(false);
              return;
            }

            // 2. Link contact record to user when password is created
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

          // 3. Mark onboarding complete
          const { error: updateError } = await supabase.auth.updateUser({
            data: { onboarding_complete: true }
          });

          if (updateError) {
            console.error('Error updating user data:', updateError);
            // Continue anyway - this is not critical
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
          errorMsg += '\n\nNote: After adding variables, restart your dev server (npm run dev).';
          
          alert(errorMsg);
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

      // 4. Save to Supabase business_profiles table if it exists and Supabase is configured
      if (user && supabase) {
        try {
          const { error: profileError } = await supabase
            .from('business_profiles')
            .upsert({
              user_id: user.id,
              business_name: formData.businessName,
              website_url: formData.website,
              instagram: formData.instagram,
              business_type: formData.businessType,
              team_size: formData.staffCount,
              monthly_clients: formData.clientCount,
              uses_photos: formData.usesPhotos,
              primary_concern: formData.primaryConcern,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (profileError) {
            console.error('Error saving profile to Supabase:', profileError);
            // Continue anyway - localStorage is the primary storage
          }
        } catch (profileErr) {
          console.error('Error saving profile:', profileErr);
          // Continue anyway
        }
      }

      if (password.trim().length > 0) {
        alert('Profile saved! Your password is now active.');
      } else {
        alert('Profile saved successfully!');
      }

      navigate('/wellness/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
      setIsSaving(false);
    }
  };

  if (!answers) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/wellness/dashboard')}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <span className="font-semibold text-slate-900">Business Profile</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Let's Finalize Your Setup</h1>
          <p className="text-slate-500 text-lg">
            Complete your profile to unlock personalized contracts and a more accurate risk score.
          </p>
        </div>

        {/* Section 1: Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="text-brand-600" size={20} />
              Business Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Section 2: Password (Optional) - Moved to top for better visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="text-brand-600" size={20} />
              Optional: Create Your Account Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Your password lets you log in later and access your saved documents.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
            {password && password.length > 0 && password.length < 8 && (
              <p className="text-xs text-red-500">Password must be at least 8 characters.</p>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Scale & Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="text-brand-600" size={20} />
              Structure & Scale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                       className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                         formData.staffCount === opt 
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
                       className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                         formData.clientCount === opt 
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
          </CardContent>
        </Card>

        {/* Section 4: Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-brand-600" size={20} />
              Operations & Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Section 5: Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-brand-600" size={20} />
              Primary Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    w-full text-left p-3 rounded-lg border transition-all text-sm
                    ${formData.primaryConcern === opt 
                      ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button 
             fullWidth 
             size="lg" 
             onClick={handleSave}
             disabled={!formData.businessName || isSaving}
             className="text-lg h-14"
          >
            {isSaving ? 'Saving...' : 'Save Profile & Update Dashboard'}
          </Button>
          {!formData.businessName && (
            <p className="text-center text-xs text-red-500 mt-2">Business Name is required to continue.</p>
          )}
        </div>

      </main>
    </div>
  );
};
