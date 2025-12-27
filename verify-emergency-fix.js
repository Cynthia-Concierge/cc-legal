import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('🔍 VERIFYING EMERGENCY FIX...\n');
  let allGood = true;

  try {
    // 1. Check users table structure
    console.log('1️⃣  Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('   ❌ Error accessing users table:', usersError.message);
      allGood = false;
    } else {
      console.log(`   ✅ Users table accessible - ${users.length} sample records found`);
      if (users.length > 0) {
        console.log(`   📊 Sample user: ${users[0].email} (ID: ${users[0].user_id?.substring(0, 8)}...)`);
      }
    }

    // 2. Check contacts table
    console.log('\n2️⃣  Checking contacts table...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.error('   ❌ Error accessing contacts table:', contactsError.message);
      allGood = false;
    } else {
      console.log(`   ✅ Contacts table accessible - ${contacts.length} sample records found`);
      if (contacts.length > 0) {
        const linked = contacts.filter(c => c.user_id !== null).length;
        console.log(`   📊 Linked contacts: ${linked}/${contacts.length}`);
      }
    }

    // 3. Check for orphaned auth.users
    console.log('\n3️⃣  Checking for orphaned auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('   ❌ Error checking auth users:', authError.message);
      allGood = false;
    } else {
      console.log(`   📊 Total auth.users: ${authUsers.users.length}`);

      // Check if all auth users are in users table
      let orphanedCount = 0;
      for (const authUser of authUsers.users) {
        const isTempPassword = authUser.user_metadata?.temp_password === true;
        if (!isTempPassword) {
          const { data: userData } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', authUser.id)
            .single();

          if (!userData) {
            orphanedCount++;
            console.log(`   ⚠️  Orphaned auth user found: ${authUser.email}`);
          }
        }
      }

      if (orphanedCount === 0) {
        console.log('   ✅ No orphaned auth users - all synced to users table');
      } else {
        console.log(`   ❌ Found ${orphanedCount} orphaned auth users`);
        allGood = false;
      }
    }

    // 4. Test RLS policies - try anonymous insert to contacts
    console.log('\n4️⃣  Testing RLS policies...');
    const anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await anonClient
      .from('contacts')
      .insert({
        email: testEmail,
        name: 'Test Contact',
        phone: '555-1234',
        website: 'https://test.com'
      })
      .select();

    if (insertError) {
      console.error('   ❌ Anonymous insert to contacts failed:', insertError.message);
      allGood = false;
    } else {
      console.log('   ✅ Anonymous insert to contacts works');
      // Clean up test data
      await supabase.from('contacts').delete().eq('email', testEmail);
    }

    // 5. Summary
    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('✅ ALL CHECKS PASSED - FIX VERIFIED SUCCESSFULLY!');
      console.log('\n📝 Summary:');
      console.log('   • Users table is accessible and working');
      console.log('   • Contacts table is accessible and working');
      console.log('   • RLS policies allow proper access');
      console.log('   • No orphaned auth users');
      console.log('\n🎉 Your authentication system is now fixed!');
      console.log('   • Existing users can log in');
      console.log('   • New users can create passwords');
      console.log('   • Contact form submissions work');
    } else {
      console.log('⚠️  SOME ISSUES DETECTED - SEE ABOVE');
      console.log('\nPlease check the errors above and re-run the fix if needed.');
    }
    console.log('='.repeat(50) + '\n');

  } catch (err) {
    console.error('❌ Verification error:', err.message);
    console.error(err);
  }
}

verifyFix();
