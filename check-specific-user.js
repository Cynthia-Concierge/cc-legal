import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser(email) {
  console.log(`🔍 CHECKING USER: ${email}\n`);

  try {
    // Get user from auth.users by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const user = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('❌ USER NOT FOUND in auth.users');
      console.log(`   No account exists with email: ${email}\n`);
      return;
    }

    console.log('✅ USER FOUND in auth.users\n');
    console.log('═'.repeat(80));
    console.log('\n📊 AUTH USER DETAILS:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ Yes (' + new Date(user.email_confirmed_at).toLocaleString() + ')' : '❌ NO'}`);
    console.log(`   Phone: ${user.phone || 'None'}`);
    console.log(`   Banned: ${user.banned_until ? '⚠️ YES - until ' + user.banned_until : 'No'}`);

    console.log('\n📝 USER METADATA:');
    console.log(JSON.stringify(user.user_metadata, null, 2));

    console.log('\n📝 APP METADATA:');
    console.log(JSON.stringify(user.app_metadata, null, 2));

    const isTempPassword = user.user_metadata?.temp_password === true;
    console.log(`\n🔐 PASSWORD STATUS: ${isTempPassword ? '❌ TEMP PASSWORD (cannot log in)' : '✅ REAL PASSWORD (can log in)'}`);

    // Check if user is in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log(`\n👤 USERS TABLE: ${userData ? '✅ Found' : '❌ Not Found'}`);
    if (userData) {
      console.log('   Data:', JSON.stringify(userData, null, 2));
    } else if (userError) {
      console.log('   Error:', userError.message);
    }

    // Check if user is in contacts table
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log(`\n📧 CONTACTS TABLE: ${contactData ? '✅ Found' : '❌ Not Found'}`);
    if (contactData) {
      console.log('   Data:', JSON.stringify(contactData, null, 2));
      console.log(`   Linked to User: ${contactData.user_id ? '✅ Yes (' + contactData.user_id + ')' : '❌ No'}`);
    } else if (contactError && contactError.code !== 'PGRST116') {
      console.log('   Error:', contactError.message);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n🎯 DIAGNOSIS:');

    if (!user.email_confirmed_at) {
      console.log('   ❌ EMAIL NOT CONFIRMED - User must confirm email before logging in');
    }

    if (user.banned_until) {
      console.log('   ❌ USER IS BANNED - Cannot log in');
    }

    if (isTempPassword) {
      console.log('   ❌ TEMP PASSWORD - User has not completed password creation');
      console.log('      The user needs to complete the onboarding flow and set a real password');
    }

    if (!userData) {
      console.log('   ⚠️  NOT IN USERS TABLE - Trigger may have failed');
      console.log('      This could cause issues after login');
    }

    if (user.email_confirmed_at && !isTempPassword && !user.banned_until) {
      console.log('   ✅ SHOULD BE ABLE TO LOG IN');
      console.log('      Email confirmed, real password set, not banned');
      console.log('\n   If login is still failing with 400 error:');
      console.log('      1. Check that the password is correct');
      console.log('      2. Try password reset');
      console.log('      3. Check browser console for more details');
      console.log('      4. Check Supabase logs for the exact error');
    }

    console.log('\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'rickibodner@gmail.com';
checkUser(email);
