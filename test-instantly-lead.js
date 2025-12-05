/**
 * Test script to send a test lead to Instantly.ai via the save-contact endpoint
 * This tests the full integration including Supabase, GoHighLevel, and Instantly.ai
 * 
 * Usage: node test-instantly-lead.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID || '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

async function testInstantlyLead() {
  console.log('🧪 Testing Instantly.ai Lead Integration');
  console.log('========================================\n');
  
  console.log('📋 Configuration:');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Campaign ID: ${CAMPAIGN_ID}`);
  console.log(`   Instantly API Key: ${process.env.INSTANTLY_AI_API_KEY ? '✅ Set' : '❌ Missing'}\n`);

  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test-lead-${timestamp}@example.com`;
  
  const testLead = {
    name: 'Test Lead User',
    email: testEmail,
    phone: '+15551234567',
    website: 'https://testwebsite.com'
  };

  console.log('📤 Sending test lead:');
  console.log(`   Name: ${testLead.name}`);
  console.log(`   Email: ${testLead.email}`);
  console.log(`   Phone: ${testLead.phone}`);
  console.log(`   Website: ${testLead.website}\n`);

  try {
    console.log('🔄 Calling /api/save-contact endpoint...\n');
    
    const response = await fetch(`${API_URL}/api/save-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead),
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON');
      console.error('Response:', responseText);
      return;
    }

    console.log('📥 Response received:');
    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      console.log('✅ Lead saved successfully!\n');
      
      if (result.supabase) {
        console.log('📊 Supabase: ✅ Saved');
      }
      
      if (result.ghl) {
        console.log('📊 GoHighLevel: ✅ Sent');
      } else if (result.ghlError) {
        console.log(`📊 GoHighLevel: ⚠️  Error - ${result.ghlError.message}`);
      }
      
      if (result.instantly) {
        console.log('📊 Instantly.ai: ✅ Lead added to campaign/list');
        console.log(`   Campaign ID: ${CAMPAIGN_ID}`);
        console.log('   ✅ Check your Instantly.ai dashboard to verify the lead was added');
      } else if (result.instantlyError) {
        console.log(`📊 Instantly.ai: ❌ Error - ${result.instantlyError.message}`);
        if (result.instantlyError.message.includes('401') || result.instantlyError.message.includes('authentication')) {
          console.log('   💡 Check your INSTANTLY_AI_API_KEY in .env file');
        }
      } else {
        console.log('📊 Instantly.ai: ⚠️  Skipped (API key not configured)');
      }
      
      console.log('\n📋 Full Response:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ Failed to save lead\n');
      console.log('Error details:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error making request:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Make sure the server is running:');
    console.error('   npm run server');
  }
}

// Run the test
testInstantlyLead().catch(console.error);
