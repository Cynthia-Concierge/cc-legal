import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPasswordAfterFix() {
  console.log('🔐 RESETTING PASSWORD FOR rickibodner@gmail.com\n');
  console.log('⚠️  Make sure you ran COMPLETE_AUTH_FIX.sql first!\n');

  const userId = 'a54db1da-f805-469f-a14d-313f50902cc6';
  const newPassword = 'NewPassword123!@#';

  try {
    console.log('Updating password...\n');

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.log('❌ FAILED:', error.message);
      console.log('\nDid you run COMPLETE_AUTH_FIX.sql first?');
      console.log('The trigger fix must be applied before this will work.\n');
      return;
    }

    console.log('✅ PASSWORD RESET SUCCESSFUL!\n');
    console.log('═'.repeat(80));
    console.log('\n🔐 YOUR NEW LOGIN CREDENTIALS:');
    console.log(`\n   Email:    rickibodner@gmail.com`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Go to http://localhost:5173/wellness/login');
    console.log('   2. Log in with the credentials above');
    console.log('   3. Change your password immediately in your account settings');
    console.log('\n═'.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

resetPasswordAfterFix();
