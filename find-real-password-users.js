import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findRealPasswordUsers() {
  console.log('🔍 SEARCHING FOR USERS WITH REAL PASSWORDS...\n');

  try {
    // Get all auth users with pagination
    let page = 1;
    let allUsers = [];

    while (true) {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });

      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
        break;
      }

      allUsers = allUsers.concat(authData.users);

      if (authData.users.length < 1000) {
        break; // No more pages
      }
      page++;
    }

    console.log(`📊 Total auth.users found: ${allUsers.length}\n`);

    // Find users with real passwords
    const realPasswordUsers = allUsers.filter(user => {
      const isTempPassword = user.user_metadata?.temp_password === true;
      return !isTempPassword;
    });

    console.log(`✅ Users with REAL passwords: ${realPasswordUsers.length}`);
    console.log(`❌ Users with TEMP passwords: ${allUsers.length - realPasswordUsers.length}\n`);

    if (realPasswordUsers.length > 0) {
      console.log('👥 Users with Real Passwords:\n');
      console.log('═'.repeat(100));

      for (const user of realPasswordUsers.slice(0, 20)) {
        console.log(`\n📧 Email: ${user.email}`);
        console.log(`   ID: ${user.id.substring(0, 8)}...`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
        console.log(`   temp_password in metadata: ${user.user_metadata?.temp_password}`);

        // Check if in users table
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        console.log(`   In Users Table: ${userData ? '✅ Yes' : '❌ NO'}`);
      }

      if (realPasswordUsers.length > 20) {
        console.log(`\n... and ${realPasswordUsers.length - 20} more users with real passwords`);
      }
    } else {
      console.log('⚠️  NO USERS HAVE REAL PASSWORDS SET!\n');
      console.log('This means:');
      console.log('  1. The password creation step is failing');
      console.log('  2. The temp_password metadata is not being cleared');
      console.log('  3. Users cannot log in\n');

      console.log('Let me check a sample user to see their metadata:\n');
      if (allUsers.length > 0) {
        const sample = allUsers[0];
        console.log('Sample User:');
        console.log(`  Email: ${sample.email}`);
        console.log(`  Metadata:`, JSON.stringify(sample.user_metadata, null, 2));
        console.log(`  App Metadata:`, JSON.stringify(sample.app_metadata, null, 2));
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

findRealPasswordUsers();
