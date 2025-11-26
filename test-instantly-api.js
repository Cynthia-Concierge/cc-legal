/**
 * Test script for Instantly.ai API endpoint
 * Usage: node test-instantly-api.js [apiUrl] [campaignId]
 */

const API_URL = process.argv[2] || 'http://localhost:3001';
const CAMPAIGN_ID = process.argv[3] || '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

async function testInstantlyAPI() {
  console.log('🧪 Testing Instantly.ai API Integration');
  console.log('========================================\n');

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
      console.log(`   Response:`, healthData);
    } else {
      console.log(`❌ Health check failed (HTTP ${healthResponse.status})`);
      console.log('   Make sure the server is running: npm run server');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Failed to connect to server');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure the server is running: npm run server');
    process.exit(1);
  }

  console.log('');

  // Test 2: Add lead endpoint
  console.log('2️⃣ Testing add-lead endpoint...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testData = {
    email: testEmail,
    campaignId: CAMPAIGN_ID,
    leadData: {
      first_name: 'Test',
      last_name: 'User',
      phone: '(555) 123-4567',
      website: 'https://testwebsite.com'
    }
  };

  console.log('   Request:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Campaign ID: ${CAMPAIGN_ID}`);
  console.log('');

  try {
    const leadResponse = await fetch(`${API_URL}/api/add-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const leadData = await leadResponse.json().catch(() => ({}));
    
    console.log(`   Response (HTTP ${leadResponse.status}):`);
    console.log('   ', JSON.stringify(leadData, null, 2));

    if (leadResponse.ok) {
      console.log('\n✅ Lead added successfully!');
      console.log('   Check your Instantly.ai dashboard to verify the lead was added.');
    } else if (leadResponse.status === 400) {
      console.log('\n⚠️  Bad request - check your campaign ID and data format');
    } else if (leadResponse.status === 401) {
      console.log('\n⚠️  Unauthorized - check your INSTANTLY_AI_API_KEY');
    } else if (leadResponse.status === 500) {
      console.log('\n❌ Server error - check server logs for details');
    } else {
      console.log(`\n⚠️  Unexpected response code: ${leadResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Failed to add lead');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n========================================');
  console.log('Test complete!');
}

testInstantlyAPI();

