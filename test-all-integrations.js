/**
 * Comprehensive test script to verify all three integrations work:
 * 1. Supabase
 * 2. Instantly.ai
 * 3. GoHighLevel
 * 
 * Run with: node test-all-integrations.js
 */

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Use production API if VITE_API_URL is not set and we're not in local dev
const API_URL = API_BASE_URL || 'https://api-dh5oijnurq-uc.a.run.app';

async function testAllIntegrations() {
  console.log('🧪 Testing All Integrations (Supabase, Instantly.ai, GoHighLevel)\n');
  console.log(`📋 API URL: ${API_URL}\n`);
  console.log('─'.repeat(60));

  // Generate unique test data
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@example.com`;
  const testName = `Test User ${timestamp}`;
  const testPhone = `555-${timestamp.toString().slice(-7)}`;
  const testWebsite = `https://test-${timestamp}.example.com`;

  const testContact = {
    name: testName,
    email: testEmail,
    phone: testPhone,
    website: testWebsite,
  };

  console.log('📝 Test Contact Data:');
  console.log(`   Name: ${testName}`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Phone: ${testPhone}`);
  console.log(`   Website: ${testWebsite}\n`);

  try {
    console.log('🚀 Sending request to /api/save-contact...\n');

    const response = await fetch(`${API_URL}/api/save-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContact),
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', responseText);
      return;
    }

    if (!response.ok) {
      console.error('❌ API Request Failed:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${result.error || result.message || 'Unknown error'}`);
      return;
    }

    console.log('✅ API Request Successful!\n');
    console.log('─'.repeat(60));
    console.log('📊 INTEGRATION RESULTS:\n');

    // Test 1: Supabase
    console.log('1️⃣  SUPABASE:');
    if (result.supabase) {
      console.log('   ✅ Success - Contact saved to Supabase');
      console.log(`   ID: ${result.supabase.id || 'N/A'}`);
      console.log(`   Email: ${result.supabase.email || testEmail}`);
    } else {
      console.log('   ❌ FAILED - No Supabase result');
    }
    console.log('');

    // Test 2: Instantly.ai
    console.log('2️⃣  INSTANTLY.AI:');
    if (result.instantly) {
      console.log('   ✅ Success - Lead added to Instantly.ai');
      console.log(`   Status: ${result.instantly.status || 'success'}`);
      if (result.instantly.uploaded_count !== undefined) {
        console.log(`   Uploaded: ${result.instantly.uploaded_count}`);
      }
    } else if (result.instantlyError) {
      console.log('   ❌ FAILED - Instantly.ai error');
      console.log(`   Error: ${result.instantlyError.message}`);
      if (result.instantlyError.status) {
        console.log(`   Status: ${result.instantlyError.status}`);
      }
    } else {
      console.log('   ⚠️  WARNING - No Instantly.ai result (may not be configured)');
    }
    console.log('');

    // Test 3: GoHighLevel
    console.log('3️⃣  GOHIGHLEVEL:');
    if (result.ghl) {
      console.log('   ✅ Success - Contact sent to GoHighLevel');
      console.log(`   Contact ID: ${result.ghl.id || result.ghl.contactId || 'N/A'}`);
      console.log(`   Name: ${result.ghl.name || testName}`);
      console.log(`   Email: ${result.ghl.email || testEmail}`);
    } else if (result.ghlError) {
      console.log('   ❌ FAILED - GoHighLevel error');
      console.log(`   Error: ${result.ghlError.message}`);
      if (result.ghlError.status) {
        console.log(`   Status: ${result.ghlError.status}`);
      }
      if (result.ghlError.responseData) {
        console.log(`   Response: ${JSON.stringify(result.ghlError.responseData, null, 2)}`);
      }
    } else {
      console.log('   ⚠️  WARNING - No GoHighLevel result');
    }
    console.log('');

    console.log('─'.repeat(60));
    console.log('📈 SUMMARY:\n');

    const supabaseSuccess = !!result.supabase;
    const instantlySuccess = !!result.instantly;
    const ghlSuccess = !!result.ghl;

    console.log(`   Supabase:     ${supabaseSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Instantly.ai: ${instantlySuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   GoHighLevel:  ${ghlSuccess ? '✅ PASS' : '❌ FAIL'}\n`);

    if (supabaseSuccess && instantlySuccess && ghlSuccess) {
      console.log('🎉 ALL INTEGRATIONS WORKING! ✅\n');
      console.log('✅ All three services successfully received the contact.');
    } else {
      console.log('⚠️  SOME INTEGRATIONS FAILED ⚠️\n');
      
      if (!supabaseSuccess) {
        console.log('❌ Supabase failed - This is critical!');
      }
      if (!instantlySuccess) {
        console.log('❌ Instantly.ai failed - Check API key and campaign ID');
      }
      if (!ghlSuccess) {
        console.log('❌ GoHighLevel failed - Check API key and location ID');
        console.log('   Current API Key: pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb');
        console.log('   Current Location ID: 7HUNbHEuRf1cXZD4hxxr');
      }
    }

    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test Error:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testAllIntegrations();
