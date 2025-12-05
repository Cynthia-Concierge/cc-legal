/**
 * Direct test of Instantly.ai API key
 * This tests the API key without going through the server
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.INSTANTLY_AI_API_KEY;
const CAMPAIGN_ID = '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

if (!API_KEY) {
  console.log('❌ INSTANTLY_AI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🧪 Testing Instantly.ai API Key Directly');
console.log('========================================\n');
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);

const testEmail = `test-${Date.now()}@example.com`;
const testLead = {
  email: testEmail,
  first_name: 'Test',
  last_name: 'User',
  phone: '(555) 123-4567',
  website: 'https://testwebsite.com'
};

console.log('Making API call to Instantly.ai (API v2 with Bearer token)...\n');

// API v2 with Bearer token (recommended)
fetch('https://api.instantly.ai/api/v2/leads/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    leads: [testLead],
    campaign_id: CAMPAIGN_ID,
    skip_if_in_workspace: false,
    skip_if_in_campaign: false,
    skip_if_in_list: false,
  }),
})
  .then(async (response) => {
    const data = await response.json().catch(() => ({}));
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Body:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! API key is valid and lead was added.');
      console.log(`   Check your Instantly.ai dashboard for email: ${testEmail}`);
    } else if (response.status === 401) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('   Possible issues:');
      console.log('   - API key is incorrect or expired');
      console.log('   - API key format is wrong');
      console.log('   - Check your Instantly.ai account settings');
    } else if (response.status === 400) {
      console.log('\n⚠️  BAD REQUEST');
      console.log('   Check:');
      console.log('   - Campaign ID is correct');
      console.log('   - Email format is valid');
      console.log('   - All required fields are present');
    } else {
      console.log(`\n⚠️  Unexpected status: ${response.status}`);
    }
  })
  .catch((error) => {
    console.log('\n❌ NETWORK ERROR');
    console.log(`   ${error.message}`);
  });

