import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveDiagnosis() {
  console.log('🔍 COMPREHENSIVE AUTH SYSTEM DIAGNOSIS\n');
  console.log('═'.repeat(80));

  const issues = [];
  const email = 'rickibodner@gmail.com';

  try {
    // 1. Check auth.users record
    console.log('\n1️⃣  CHECKING AUTH.USERS RECORD...\n');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Cannot access auth.users:', authError.message);
      issues.push('Cannot access auth.users table');
    } else {
      const authUser = authData.users.find(u => u.email === email);

      if (!authUser) {
        console.log(`❌ No auth.users record for ${email}`);
        issues.push(`No auth.users record for ${email}`);
      } else {
        console.log(`✅ Auth user found`);
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? '✅ Yes' : '❌ NO'}`);
        console.log(`   Banned: ${authUser.banned_until ? '⚠️ YES' : '✅ No'}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);
        console.log(`   Created: ${authUser.created_at}`);

        // Check for issues
        if (!authUser.email_confirmed_at) {
          issues.push('Email not confirmed');
        }
        if (authUser.banned_until) {
          issues.push('User is banned');
        }

        // Check metadata
        console.log(`\n   User Metadata:`);
        console.log(JSON.stringify(authUser.user_metadata, null, 4));

        if (authUser.user_metadata?.temp_password === true) {
          console.log(`   ⚠️  Has temp password - cannot log in`);
          issues.push('User has temp_password flag set to true');
        }

        // Try to get user by ID to check auth system access
        const { data: getUserData, error: getUserError } = await supabase.auth.admin.getUserById(authUser.id);
        if (getUserError) {
          console.log(`\n   ❌ Cannot get user by ID: ${getUserError.message}`);
          issues.push(`Cannot get user by ID: ${getUserError.message}`);
        }
      }
    }

    // 2. Check users table record
    console.log('\n2️⃣  CHECKING USERS TABLE RECORD...\n');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (usersError) {
      if (usersError.code === 'PGRST116') {
        console.log(`❌ No users table record for ${email}`);
        issues.push(`No users table record for ${email}`);
      } else {
        console.log(`❌ Error accessing users table: ${usersError.message}`);
        issues.push(`Error accessing users table: ${usersError.message}`);
      }
    } else {
      console.log(`✅ Users table record found`);
      console.log(JSON.stringify(usersData, null, 2));
    }

    // 3. Check contacts table record
    console.log('\n3️⃣  CHECKING CONTACTS TABLE RECORD...\n');
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .single();

    if (contactError) {
      if (contactError.code === 'PGRST116') {
        console.log(`   No contact record (this is OK)`);
      } else {
        console.log(`   ⚠️  Error: ${contactError.message}`);
      }
    } else {
      console.log(`✅ Contact record found`);
      console.log(`   Linked to user_id: ${contactData.user_id || 'NOT LINKED'}`);
    }

    // 4. Test password reset
    console.log('\n4️⃣  TESTING PASSWORD RESET FUNCTION...\n');
    const anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/wellness/reset-password'
    });

    if (resetError) {
      console.log(`❌ Password reset failed: ${resetError.message}`);
      issues.push(`Password reset failed: ${resetError.message}`);
    } else {
      console.log(`✅ Password reset email should be sent`);
    }

    // 5. Check RLS policies
    console.log('\n5️⃣  CHECKING RLS POLICIES...\n');

    // Try to select from users table as anon
    const { data: anonSelectUsers, error: anonSelectUsersError } = await anonClient
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (anonSelectUsersError) {
      console.log(`   ⚠️  Anon cannot SELECT from users table (expected): ${anonSelectUsersError.message}`);
    } else {
      console.log(`   ⚠️  Anon CAN select from users table (potential security issue)`);
    }

    // 6. Check for trigger issues
    console.log('\n6️⃣  CHECKING TRIGGERS...\n');

    // List all triggers
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers
          WHERE event_object_table IN ('users', 'contacts')
          OR event_object_schema = 'auth'
        `
      })
      .catch(() => null);

    if (!triggers) {
      console.log(`   ℹ️  Cannot check triggers directly (expected)`);
    }

    // 7. Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 DIAGNOSIS SUMMARY:\n');

    if (issues.length === 0) {
      console.log('✅ No obvious issues found!');
      console.log('\nThe account appears to be set up correctly.');
      console.log('The 400 error might be due to:');
      console.log('  1. Wrong password');
      console.log('  2. Rate limiting');
      console.log('  3. Frontend/network issue');
      console.log('\nRecommendation: Use password reset to set a new password');
    } else {
      console.log(`❌ FOUND ${issues.length} ISSUE(S):\n`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Diagnosis error:', err.message);
    console.error(err);
  }
}

comprehensiveDiagnosis();
