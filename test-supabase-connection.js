/**
 * Test script to verify Supabase connection
 * Run with: node test-supabase-connection.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('\nPlease make sure your .env file contains:');
    console.log('SUPABASE_URL=your-supabase-url');
    console.log('SUPABASE_ANON_KEY=your-supabase-anon-key\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if contacts table exists and is accessible
    console.log('📊 Test 1: Checking contacts table...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.error('❌ Error accessing contacts table:', contactsError.message);
      console.error('\n💡 This might mean:');
      console.error('   - The contacts table doesn\'t exist (run the SQL script)');
      console.error('   - Row Level Security (RLS) is blocking access');
      console.error('   - The anon key doesn\'t have proper permissions\n');
      throw contactsError;
    }

    console.log('✅ Contacts table is accessible');
    console.log(`   Found ${contacts?.length || 0} existing contact(s)\n`);

    // Test 2: Try inserting a test contact
    console.log('📝 Test 2: Testing insert operation...');
    const testContact = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      phone: '(555) 123-4567',
      website: 'https://test.com',
    };

    const { data: insertedContact, error: insertError } = await supabase
      .from('contacts')
      .insert([testContact])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test contact:', insertError.message);
      console.error('\n💡 This might mean:');
      console.error('   - Row Level Security (RLS) is blocking inserts');
      console.error('   - The table structure doesn\'t match (check SQL)');
      console.error('   - Required fields are missing\n');
      throw insertError;
    }

    console.log('✅ Successfully inserted test contact');
    console.log(`   ID: ${insertedContact.id}`);
    console.log(`   Email: ${insertedContact.email}\n`);

    // Test 3: Clean up test contact
    console.log('🧹 Test 3: Cleaning up test contact...');
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', insertedContact.id);

    if (deleteError) {
      console.warn('⚠️  Warning: Could not delete test contact:', deleteError.message);
      console.warn('   (You may want to delete it manually from Supabase dashboard)\n');
    } else {
      console.log('✅ Test contact cleaned up\n');
    }

    // All tests passed
    console.log('🎉 All tests passed! Supabase connection is working correctly.\n');
    console.log('📋 Next steps:');
    console.log('   1. Make sure your form submits to /api/save-contact');
    console.log('   2. Test the form on your landing page');
    console.log('   3. Check the contacts table in Supabase dashboard\n');

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);

