/**
 * Check recent trademark quiz submissions in the database
 * Run with: node check-trademark-submissions.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubmissions() {
  console.log('🔍 Checking trademark_requests table for recent submissions...\n');

  try {
    // Get recent submissions
    const { data: submissions, error } = await supabase
      .from('trademark_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error querying trademark_requests:', error);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log('⚠️ No submissions found in trademark_requests table.');
      console.log('   This could mean:');
      console.log('   1. No one has submitted the quiz yet');
      console.log('   2. The database insert is failing');
      console.log('   3. Check server logs when submitting the quiz\n');
      return;
    }

    console.log(`✅ Found ${submissions.length} submission(s):\n`);

    submissions.forEach((sub, index) => {
      console.log(`${index + 1}. Submission ID: ${sub.id}`);
      console.log(`   User ID: ${sub.user_id}`);
      console.log(`   Business Name: ${sub.business_name}`);
      console.log(`   Quiz Score: ${sub.quiz_score}`);
      console.log(`   Risk Level: ${sub.risk_level}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
      console.log(`   Has quiz_answers: ${sub.quiz_answers ? `Yes (${Array.isArray(sub.quiz_answers) ? sub.quiz_answers.length : 'N/A'} items)` : 'No ❌'}`);
      console.log(`   Has answer_details: ${sub.answer_details ? `Yes (${Array.isArray(sub.answer_details) ? sub.answer_details.length : 'N/A'} items)` : 'No ❌'}`);
      
      if (sub.quiz_answers) {
        console.log(`   Quiz answers preview: [${sub.quiz_answers.slice(0, 5).join(', ')}${sub.quiz_answers.length > 5 ? '...' : ''}]`);
      }
      
      if (sub.answer_details && Array.isArray(sub.answer_details) && sub.answer_details.length > 0) {
        console.log(`   Answer details preview: ${JSON.stringify(sub.answer_details[0])}...`);
      }
      
      console.log('');
    });

    // Check if any are missing quiz_answers or answer_details
    const missingData = submissions.filter(s => !s.quiz_answers || !s.answer_details);
    if (missingData.length > 0) {
      console.log(`⚠️ Warning: ${missingData.length} submission(s) are missing quiz_answers or answer_details!`);
      console.log('   This suggests the data is not being saved correctly.\n');
    } else {
      console.log('✅ All submissions have quiz_answers and answer_details saved!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSubmissions();
