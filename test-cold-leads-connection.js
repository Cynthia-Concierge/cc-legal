/**
 * Test script to verify cold_leads table and RLS setup
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function testColdLeadsConnection() {
  console.log('🔍 Testing Cold Leads Table Connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if table exists
    console.log('📊 Test 1: Checking if cold_leads table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('cold_leads')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST205') {
        console.error('❌ Table does not exist!');
        console.error('   Please run the SQL script: supabase_cold_leads_table.sql\n');
        process.exit(1);
      }
      throw tableError;
    }

    console.log('✅ Table exists\n');

    // Test 2: Try inserting a test record
    console.log('📝 Test 2: Testing insert with RLS...');
    const testLead = {
      first_name: 'Test',
      last_name: 'Lead',
      company: 'Test Company',
      email_1: `test-${Date.now()}@example.com`,
      source: 'test',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('cold_leads')
      .insert([testLead])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('\n💡 RLS is still blocking inserts. Try:');
      console.error('   1. Run this SQL in Supabase:');
      console.error('      DROP POLICY IF EXISTS "Allow anonymous inserts" ON cold_leads;');
      console.error('      CREATE POLICY "Allow anonymous inserts" ON cold_leads');
      console.error('        FOR INSERT TO anon, authenticated, service_role');
      console.error('        WITH CHECK (true);');
      console.error('\n   2. Or use SUPABASE_SERVICE_ROLE_KEY in .env\n');
      process.exit(1);
    }

    console.log('✅ Insert successful!');
    console.log(`   Test lead ID: ${inserted.id}\n`);

    // Test 3: Clean up
    console.log('🧹 Test 3: Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('cold_leads')
      .delete()
      .eq('id', inserted.id);

    if (deleteError) {
      console.warn('⚠️  Could not delete test record:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up\n');
    }

    console.log('🎉 All tests passed! Ready to import leads.\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error);
    process.exit(1);
  }
}

testColdLeadsConnection().catch(console.error);

