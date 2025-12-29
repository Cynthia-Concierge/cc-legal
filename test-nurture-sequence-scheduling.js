/**
 * Test script to verify nurture sequence email scheduling is working
 * Run with: node test-nurture-sequence-scheduling.js
 */

const API_BASE_URL = process.env.API_URL || 'https://cc-legal.web.app/api';

async function testNurtureSequenceScheduling() {
  console.log('🧪 Testing Nurture Sequence Email Scheduling\n');
  console.log(`📍 API URL: ${API_BASE_URL}\n`);

  // You'll need to provide a real user ID from your database
  // Get one with: SELECT user_id, email FROM users WHERE password_created_at IS NOT NULL LIMIT 1;
  const testUserId = process.argv[2];

  if (!testUserId) {
    console.error('❌ Please provide a user ID to test with');
    console.error('   Usage: node test-nurture-sequence-scheduling.js <user-id>');
    console.error('\n   To get a user ID, run this SQL in Supabase:');
    console.error('   SELECT user_id, email FROM users WHERE password_created_at IS NOT NULL LIMIT 1;');
    process.exit(1);
  }

  try {
    console.log(`📧 Testing with user ID: ${testUserId}\n`);
    console.log('🚀 Sending request to /api/emails/schedule-nurture-sequence...\n');

    const response = await fetch(`${API_BASE_URL}/emails/schedule-nurture-sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId
      }),
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Invalid JSON response:', responseText);
      console.error('Status:', response.status);
      process.exit(1);
    }

    console.log('📦 Response Status:', response.status);
    console.log('📦 Response Body:', JSON.stringify(result, null, 2));
    console.log('');

    if (response.status === 200 && result.success) {
      console.log('✅ Nurture sequence emails scheduled successfully!\n');
      
      if (result.tasks && result.tasks.length > 0) {
        console.log('📋 Scheduled Tasks:');
        result.tasks.forEach((task, index) => {
          if (task.error) {
            console.log(`   ${index + 1}. ${task.email} (Day ${task.day}): ❌ Error - ${task.error}`);
          } else {
            console.log(`   ${index + 1}. ${task.email} (Day ${task.day}): ✅ Scheduled`);
            console.log(`      Task Name: ${task.taskName}`);
            console.log(`      Scheduled For: ${task.scheduledFor}`);
          }
        });
      }

      console.log('\n📊 Next Steps:');
      console.log('1. Check Cloud Tasks queue:');
      console.log('   gcloud tasks list --queue=email-reminders --location=us-central1');
      console.log('\n2. Check Firebase Functions logs:');
      console.log('   firebase functions:log --only api | grep "Nurture Sequence"');
      console.log('\n3. Verify tasks are created:');
      console.log('   You should see 4 tasks in the queue (one for each email)');
    } else {
      console.error('❌ Scheduling failed');
      console.error('   Error:', result.error || 'Unknown error');
      if (result.details) {
        console.error('   Details:', result.details);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      console.error('\n💡 Network error - check your internet connection');
      console.error(`   or verify the API URL is correct: ${API_BASE_URL}`);
    }
    process.exit(1);
  }
}

// Run the test
testNurtureSequenceScheduling();

