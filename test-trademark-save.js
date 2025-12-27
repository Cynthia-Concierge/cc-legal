/**
 * Test script to verify trademark quiz data is being saved to the database
 * Run with: node test-trademark-save.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrademarkSave() {
  console.log('🧪 Testing trademark_requests table insert...\n');

  // First, get a real user_id from the database
  // The foreign key references auth.users, so we need to find an existing user_id
  // Try to get one from existing trademark_requests first, or use a known user
  console.log('0️⃣ Finding a valid user_id...');
  
  // Try to get a user_id from existing trademark_requests
  const { data: existingRequests, error: existingError } = await supabase
    .from('trademark_requests')
    .select('user_id')
    .limit(1);
  
  let testUserId;
  
  if (existingRequests && existingRequests.length > 0) {
    testUserId = existingRequests[0].user_id;
    console.log(`✅ Found existing user_id from trademark_requests: ${testUserId}\n`);
  } else {
    // Try to get from public.users (IDs should match auth.users if synced)
    const { data: publicUsers, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (userError || !publicUsers || publicUsers.length === 0) {
      console.error('❌ Could not find any users!');
      console.error('   Error:', userError?.message || 'No users found');
      console.log('\n💡 Tip: You need to have at least one user in auth.users.');
      console.log('   The user_id must exist in auth.users (not just public.users).');
      console.log('   Try submitting the quiz through the app first, then run this test.');
      return;
    }
    
    testUserId = publicUsers[0].id;
    console.log(`⚠️ Using user from public.users (ID should match auth.users): ${publicUsers[0].email} (${testUserId})`);
    console.log('   If this fails, the user might not exist in auth.users.\n');
  }
  
  if (!testUserId) {
    console.error('❌ Could not find a valid user_id!');
    console.log('\n💡 Tip: You need to have at least one user in auth.users.');
    console.log('   The user_id must exist in auth.users (not just public.users).');
    console.log('   Try submitting the quiz through the app first, then run this test.');
    return;
  }
  
  console.log(`✅ Using user_id: ${testUserId}\n`);

  // Test data
  const testData = {
    user_id: testUserId,
    business_name: 'Test Business Name',
    quiz_score: 15,
    risk_level: 'MODERATE RISK',
    status: 'completed',
    quiz_answers: [5, 3, 2, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3], // Sample answers array
    answer_details: [
      { questionId: 1, answerText: 'No, but I registered my LLC/DBA', score: 5 },
      { questionId: 2, answerText: 'Partial search', score: 3 }
    ]
  };

  console.log('📝 Test data:', JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    // Check if table exists and has the columns
    console.log('1️⃣ Checking if table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('trademark_requests')
      .select('*')
      .limit(0);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.error('❌ Table "trademark_requests" does not exist!');
        console.error('   Run the migration: supabase_trademark_tables.sql');
        return;
      } else {
        console.error('❌ Error checking table:', tableError);
        return;
      }
    }
    console.log('✅ Table exists\n');

    // Check if columns exist
    console.log('2️⃣ Checking if quiz_answers and answer_details columns exist...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('trademark_requests')
      .select('quiz_answers, answer_details')
      .limit(1);

    if (sampleError) {
      if (sampleError.message?.includes('column') && sampleError.message?.includes('does not exist')) {
        console.error('❌ Columns quiz_answers or answer_details do not exist!');
        console.error('   Run the migration: migration_add_trademark_quiz_answers.sql');
        return;
      }
    }
    console.log('✅ Columns exist\n');

    // Try to insert test data
    console.log('3️⃣ Attempting to insert test data...');
    const { data: insertData, error: insertError } = await supabase
      .from('trademark_requests')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('   Code:', insertError.code);
      console.error('   Message:', insertError.message);
      console.error('   Hint:', insertError.hint);
      return;
    }

    console.log('✅ Insert successful!');
    console.log('   Record ID:', insertData[0]?.id);
    console.log('   Quiz answers saved:', insertData[0]?.quiz_answers ? 'Yes' : 'No');
    console.log('   Answer details saved:', insertData[0]?.answer_details ? 'Yes' : 'No');
    console.log('\n');

    // Clean up test data
    console.log('4️⃣ Cleaning up test data...');
    if (insertData[0]?.id) {
      const { error: deleteError } = await supabase
        .from('trademark_requests')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.warn('⚠️ Could not delete test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up\n');
      }
    }

    console.log('🎉 All tests passed! The database is ready to save trademark quiz data.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testTrademarkSave();
