/**
 * Diagnostic script to check contacts table RLS policies
 * This will help identify why live domain can't save contacts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  console.error('   SUPABASE_ANON_KEY:', !!anonKey);
  process.exit(1);
}

async function diagnoseContactsTable() {
  console.log('🔍 Diagnosing contacts table RLS policies\n');
  console.log('─'.repeat(60));

  // Test 1: Check if we can insert with service role key
  console.log('\n1️⃣  Testing INSERT with SERVICE ROLE KEY (should bypass RLS)...');
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const testData = {
      email: `test-admin-${Date.now()}@example.com`,
      name: 'Service Role Test',
      phone: '',
      website: '',
      source: 'diagnostic_test'
    };

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert([testData])
      .select();

    if (error) {
      console.log('   ❌ FAILED with service role key!');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('   ✅ SUCCESS with service role key');
      console.log('   Created contact:', data[0]?.id);

      // Clean up
      await supabaseAdmin.from('contacts').delete().eq('id', data[0].id);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }

  // Test 2: Check if we can insert with anon key (simulates live domain)
  console.log('\n2️⃣  Testing INSERT with ANON KEY (simulates live frontend)...');
  const supabaseAnon = createClient(supabaseUrl, anonKey);

  try {
    const testData = {
      email: `test-anon-${Date.now()}@example.com`,
      name: 'Anon Test',
      phone: '',
      website: '',
      source: 'diagnostic_test'
    };

    const { data, error } = await supabaseAnon
      .from('contacts')
      .insert([testData])
      .select();

    if (error) {
      console.log('   ❌ FAILED with anon key! 🚨 THIS IS THE PROBLEM!');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      console.log('\n   💡 This means your live frontend cannot save contacts!');
    } else {
      console.log('   ✅ SUCCESS with anon key');
      console.log('   Created contact:', data[0]?.id);

      // Clean up
      await supabaseAdmin.from('contacts').delete().eq('id', data[0].id);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }

  // Test 3: Check RLS status
  console.log('\n3️⃣  Checking RLS policies...');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables
          WHERE tablename = 'contacts' AND schemaname = 'public'
        `
      });

    if (error) {
      console.log('   ⚠️  Could not check RLS status directly');
      console.log('   (This is normal if exec_sql function is not available)');
    } else {
      console.log('   Table info:', data);
    }
  } catch (err) {
    console.log('   ⚠️  Could not check RLS status:', err.message);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('   • If Test 1 passed and Test 2 failed:');
  console.log('     → RLS policies are blocking anonymous inserts');
  console.log('     → Your backend API works (uses service role key)');
  console.log('     → But direct frontend inserts fail');
  console.log('\n   • Solution: Run the fix_contacts_rls_simple.sql script');
  console.log('\n' + '─'.repeat(60));
}

diagnoseContactsTable().catch(console.error);
