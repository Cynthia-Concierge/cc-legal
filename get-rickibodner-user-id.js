import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserId() {
  console.log('🔍 GETTING USER_ID FOR rickibodner@gmail.com from users table...\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rickibodner@gmail.com')
      .single();

    if (error || !data) {
      console.log('❌ Not found in users table');
      if (error) console.log('Error:', error.message);
      return;
    }

    console.log('✅ Found in users table:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log(`\n📌 USER_ID: ${data.user_id}\n`);

    // Now check if this user_id exists in auth.users
    console.log('Checking if this user_id exists in auth.users...\n');

    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(data.user_id);

    if (authError || !authData?.user) {
      console.log('❌ AUTH ACCOUNT MISSING!');
      console.log('   The users table has a record, but auth.users does not.');
      console.log('   This is why login is failing - the authentication account is gone.\n');

      if (authError) {
        console.log('   Auth Error:', authError.message);
      }
    } else {
      console.log('✅ Auth account found:');
      console.log(`   Email: ${authData.user.email}`);
      console.log(`   Email Confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'NO'}`);
      console.log(`   Temp Password: ${authData.user.user_metadata?.temp_password === true ? 'YES' : 'NO'}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

getUserId();
