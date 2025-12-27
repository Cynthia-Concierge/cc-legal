import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkByUserId(userId) {
  console.log(`🔍 CHECKING AUTH USER BY ID: ${userId}\n`);

  try {
    // Get user from auth.users by ID
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      console.log('❌ AUTH USER NOT FOUND');
      console.log(`   No auth.users record exists with ID: ${userId}`);
      if (userError) {
        console.log(`   Error: ${userError.message}\n`);
      }

      // Check if exists in users table
      const { data: usersTableData } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (usersTableData) {
        console.log('\n⚠️  ORPHANED RECORD FOUND:');
        console.log('   ❌ Record exists in users table but NOT in auth.users');
        console.log('   This means the auth account was deleted but the users table record remains\n');
        console.log('   Users table data:');
        console.log(JSON.stringify(usersTableData, null, 2));
        console.log('\n🔧 TO FIX:');
        console.log('   You need to recreate the auth account for this email');
        console.log('   The user will need to go through password creation again');
      }

      return null;
    }

    const user = userData.user;
    console.log('✅ AUTH USER FOUND\n');
    console.log('═'.repeat(80));
    console.log(`\nEmail: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log(`Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ NO'}`);
    console.log(`Temp Password: ${user.user_metadata?.temp_password === true ? '❌ YES' : '✅ NO'}`);
    console.log(`\nUser Metadata:`, JSON.stringify(user.user_metadata, null, 2));
    console.log('═'.repeat(80) + '\n');

    return user;

  } catch (err) {
    console.error('❌ Error:', err.message);
    return null;
  }
}

// Get user_id from command line
const userId = process.argv[2] || 'a54db1da-f805-469f-a14d-313f50d689ee';
checkByUserId(userId);
