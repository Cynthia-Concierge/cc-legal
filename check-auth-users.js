import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthUsers() {
  console.log('🔍 CHECKING AUTH USERS STATUS...\n');

  try {
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Total auth.users: ${authData.users.length}\n`);

    // Categorize users
    let tempPasswordUsers = 0;
    let realPasswordUsers = 0;
    let unconfirmedUsers = 0;
    let confirmedUsers = 0;

    console.log('👥 User Details:\n');
    console.log('═'.repeat(100));

    for (const user of authData.users.slice(0, 10)) {  // Show first 10 users
      const isTempPassword = user.user_metadata?.temp_password === true;
      const isConfirmed = user.email_confirmed_at !== null;

      if (isTempPassword) tempPasswordUsers++;
      else realPasswordUsers++;

      if (isConfirmed) confirmedUsers++;
      else unconfirmedUsers++;

      console.log(`\n📧 Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Email Confirmed: ${isConfirmed ? '✅ Yes' : '❌ NO'} ${user.email_confirmed_at ? `(${new Date(user.email_confirmed_at).toLocaleString()})` : ''}`);
      console.log(`   Has Real Password: ${!isTempPassword ? '✅ Yes' : '❌ NO (temp password)'}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);

      // Check if user is in users table
      const { data: userData } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      console.log(`   In Users Table: ${userData ? '✅ Yes' : '❌ NO'}`);
    }

    if (authData.users.length > 10) {
      console.log(`\n... and ${authData.users.length - 10} more users\n`);
    }

    console.log('\n' + '═'.repeat(100));
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Users: ${authData.users.length}`);
    console.log(`   Email Confirmed: ${confirmedUsers}`);
    console.log(`   Email Unconfirmed: ${unconfirmedUsers}`);
    console.log(`   With Real Passwords: ${realPasswordUsers}`);
    console.log(`   With Temp Passwords: ${tempPasswordUsers}`);

    if (unconfirmedUsers > 0) {
      console.log('\n⚠️  WARNING: Some users have unconfirmed emails!');
      console.log('   Users with unconfirmed emails cannot log in.');
      console.log('   They need to click the confirmation link in their email first.\n');
    }

    if (tempPasswordUsers > 0) {
      console.log('\n💡 INFO: Some users still have temp passwords.');
      console.log('   These users are in the onboarding flow but haven\'t set a real password yet.\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkAuthUsers();
