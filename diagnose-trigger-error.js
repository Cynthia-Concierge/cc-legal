import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseTriggerError() {
  console.log('🔍 DIAGNOSING TRIGGER ERROR\n');

  try {
    // Create a test auth user
    const testEmail = `trigger-test-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    console.log('Creating test user...\n');

    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        temp_password: false,
        name: 'Trigger Test'
      }
    });

    if (signUpError) {
      console.log('❌ Failed to create user:', signUpError.message);
      return;
    }

    console.log('✅ Auth user created:', signUpData.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if in users table
    console.log('\nChecking users table...\n');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', signUpData.user.id);

    if (userError) {
      console.log('❌ Error querying users table:', userError.message);
    } else if (!userData || userData.length === 0) {
      console.log('❌ User NOT in users table');
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('   1. Trigger has an error in the users table INSERT');
      console.log('   2. Missing required columns');
      console.log('   3. Constraint violation\n');

      // Try to manually insert to see what error we get
      console.log('Attempting manual insert to identify error...\n');

      const { data: manualInsert, error: manualError } = await supabase
        .from('users')
        .insert({
          user_id: signUpData.user.id,
          email: testEmail,
          name: 'Trigger Test',
          password_created_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (manualError) {
        console.log('❌ MANUAL INSERT FAILED:');
        console.log('   Error:', manualError.message);
        console.log('   Code:', manualError.code);
        console.log('   Details:', manualError.details);
        console.log('   Hint:', manualError.hint);
        console.log('\n💡 This is the error the trigger is encountering!\n');
      } else {
        console.log('✅ Manual insert succeeded!');
        console.log('   This means the trigger logic has a bug, not a schema issue.\n');
      }
    } else {
      console.log('✅ User IS in users table!');
      console.log('   Data:', JSON.stringify(userData[0], null, 2));
      console.log('\n🎉 Trigger is working!\n');
    }

    // Cleanup
    console.log('Cleaning up...');
    await supabase.from('users').delete().eq('user_id', signUpData.user.id);
    await supabase.auth.admin.deleteUser(signUpData.user.id);
    console.log('✅ Cleanup complete\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

diagnoseTriggerError();
