import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forcePasswordReset() {
  console.log('🔧 FORCE PASSWORD RESET FOR rickibodner@gmail.com\n');

  const email = 'rickibodner@gmail.com';
  const userId = 'a54db1da-f805-469f-a14d-313f50902cc6';

  try {
    // Option 1: Set a new temporary password directly
    console.log('Setting a new temporary password...\n');

    const newPassword = 'TempPass123!@#';

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true
    });

    if (error) {
      console.log('❌ Failed to update password:', error.message);
      console.log('Error details:', error);
      return;
    }

    console.log('✅ PASSWORD UPDATED SUCCESSFULLY!\n');
    console.log('═'.repeat(80));
    console.log('\n🔐 NEW TEMPORARY CREDENTIALS:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANT: Use these credentials to log in NOW');
    console.log('   Then immediately change your password in the dashboard');
    console.log('\n═'.repeat(80) + '\n');

    // Verify it worked
    console.log('Verifying the update...\n');
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    console.log('User status:');
    console.log(`   Email: ${userData.user.email}`);
    console.log(`   Email Confirmed: ${userData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Updated: ${userData.user.updated_at}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

forcePasswordReset();
