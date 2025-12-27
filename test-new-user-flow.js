import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const serviceClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anonClient = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function testNewUserFlow() {
  console.log('🧪 TESTING NEW USER SIGNUP FLOW\n');
  console.log('═'.repeat(80));

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // STEP 1: Submit contact form (what happens when user fills out the initial form)
    console.log('\n1️⃣  STEP 1: Submitting contact form...\n');

    const { data: contactData, error: contactError } = await anonClient
      .from('contacts')
      .insert({
        email: testEmail,
        name: 'Test User',
        phone: '+1234567890',
        website: 'https://test.com',
        source: 'wellness'
      })
      .select()
      .single();

    if (contactError) {
      console.log('❌ Contact insert failed:', contactError.message);
      return;
    }

    console.log('✅ Contact created:', contactData.email);

    // STEP 2: Sign up with temp password (what happens during onboarding email step)
    console.log('\n2️⃣  STEP 2: Creating auth user with temp password...\n');

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'temp_' + Math.random().toString(36),
      options: {
        data: {
          temp_password: true,
          name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Signup failed:', signUpError.message);
      return;
    }

    console.log('✅ Auth user created with temp password');
    console.log('   User ID:', signUpData.user?.id);

    // Check if trigger added to users table
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

    const { data: usersCheck1 } = await serviceClient
      .from('users')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    console.log('   In users table?', usersCheck1 ? '❌ YES (should NOT be - has temp password)' : '✅ NO (correct)');

    // STEP 3: Update to real password (what happens when user sets their password)
    console.log('\n3️⃣  STEP 3: Updating to real password...\n');

    const { data: updateData, error: updateError } = await anonClient.auth.updateUser({
      password: testPassword,
      data: { temp_password: false }
    });

    if (updateError) {
      console.log('❌ Password update failed:', updateError.message);
      console.log('   Full error:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Password updated successfully');

    // Wait for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user was added to users table by trigger
    const { data: usersCheck2, error: usersError } = await serviceClient
      .from('users')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    if (usersError || !usersCheck2) {
      console.log('❌ NOT ADDED TO USERS TABLE BY TRIGGER');
      console.log('   Error:', usersError?.message || 'No record found');
      console.log('\n   🔍 This is the problem! The trigger should have added the user.');
    } else {
      console.log('✅ Added to users table by trigger');
      console.log('   Data:', JSON.stringify(usersCheck2, null, 2));
    }

    // Check if contact was linked
    const { data: contactCheck } = await serviceClient
      .from('contacts')
      .select('*')
      .eq('email', testEmail)
      .single();

    console.log('   Contact linked to user?', contactCheck?.user_id ? `✅ Yes (${contactCheck.user_id})` : '❌ No');

    // STEP 4: Try to create business profile (what the frontend does)
    console.log('\n4️⃣  STEP 4: Creating business profile...\n');

    const { data: profileData, error: profileError } = await anonClient
      .from('business_profiles')
      .insert({
        user_id: signUpData.user.id,
        website_url: 'https://test.com',
        business_type: 'Test Business'
      })
      .select()
      .single();

    if (profileError) {
      console.log('❌ Business profile creation failed:', profileError.message);
      console.log('   Code:', profileError.code);
      console.log('   Details:', profileError.details);
      console.log('   Hint:', profileError.hint);
    } else {
      console.log('✅ Business profile created');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 SUMMARY:\n');

    const summary = {
      contact_created: !!contactData,
      auth_user_created: !!signUpData.user,
      password_updated: !!updateData,
      added_to_users_table: !!usersCheck2,
      contact_linked: !!contactCheck?.user_id,
      business_profile_created: !!profileData
    };

    Object.entries(summary).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key.replace(/_/g, ' ')}`);
    });

    const allPassed = Object.values(summary).every(v => v);

    if (allPassed) {
      console.log('\n🎉 ALL STEPS PASSED - New user flow works!\n');
    } else {
      console.log('\n❌ SOME STEPS FAILED - See details above\n');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await serviceClient.from('business_profiles').delete().eq('user_id', signUpData.user.id);
    await serviceClient.from('users').delete().eq('user_id', signUpData.user.id);
    await serviceClient.from('contacts').delete().eq('email', testEmail);
    await serviceClient.auth.admin.deleteUser(signUpData.user.id);
    console.log('✅ Cleanup complete\n');

  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.error(err);
  }
}

testNewUserFlow();
