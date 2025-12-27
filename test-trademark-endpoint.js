/**
 * Test the trademark endpoint directly
 * Run with: node test-trademark-endpoint.js
 * 
 * This will test the actual API endpoint to see if it's working
 */

import dotenv from 'dotenv';

dotenv.config();

const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:3001';

async function testEndpoint() {
  console.log('🧪 Testing /api/trademarks/request endpoint...\n');
  console.log(`Server URL: ${SERVER_URL}\n`);

  // You'll need to provide a real user_id from auth.users
  // Get this from your Supabase dashboard or from a logged-in user
  const testData = {
    user_id: process.env.TEST_USER_ID || 'YOUR_USER_ID_HERE', // Replace with real user_id
    email: 'test@example.com',
    name: 'Test User',
    businessName: 'Test Business',
    score: 15,
    riskLevel: 'MODERATE RISK',
    answers: [5, 3, 2, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3],
    answerDetails: [
      { questionId: 1, answerText: 'No, but I registered my LLC/DBA', score: 5 },
      { questionId: 2, answerText: 'Partial search', score: 3 }
    ]
  };

  if (testData.user_id === 'YOUR_USER_ID_HERE') {
    console.error('❌ Please set TEST_USER_ID in .env or replace YOUR_USER_ID_HERE with a real user_id');
    console.log('\n💡 To get a user_id:');
    console.log('   1. Log into your app');
    console.log('   2. Open browser console');
    console.log('   3. Run: (await supabase.auth.getUser()).data.user.id');
    console.log('   4. Copy that ID and set TEST_USER_ID in .env\n');
    return;
  }

  console.log('📝 Test data:', JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    console.log('📤 Sending POST request to /api/trademarks/request...\n');
    
    const response = await fetch(`${SERVER_URL}/api/trademarks/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`Response status: ${response.status} ${response.statusText}\n`);

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Request successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n');
      
      if (result.dbSaved === true) {
        console.log('✅ Database save: SUCCESS');
      } else if (result.dbSaved === false) {
        console.log('❌ Database save: FAILED');
        console.log('Error:', result.dbError);
      } else {
        console.log('⚠️ Database save: UNKNOWN (response missing dbSaved field)');
      }
    } else {
      console.error('❌ Request failed!');
      console.error('Error:', result);
    }

  } catch (error) {
    console.error('❌ Error making request:', error.message);
    console.error('\n💡 Make sure your server is running on', SERVER_URL);
  }
}

testEndpoint();
