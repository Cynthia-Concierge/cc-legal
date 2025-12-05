/**
 * Test script to verify save-contact endpoint works with both Supabase and GoHighLevel
 * Run with: node test-save-contact-integration.js
 * 
 * Make sure your server is running: npm run server
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testSaveContact() {
  console.log('🧪 Testing /api/save-contact endpoint...\n');
  console.log(`📍 API URL: ${API_BASE_URL}\n`);

  // Generate unique test data
  const timestamp = Date.now();
  const testData = {
    name: `Test User ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    phone: `555-${timestamp.toString().slice(-4)}`,
    website: 'https://test-example.com',
  };

  console.log('📝 Test Data:');
  console.log(`   Name: ${testData.name}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Phone: ${testData.phone}`);
  console.log(`   Website: ${testData.website}\n`);

  try {
    console.log('🚀 Sending request to /api/save-contact...\n');

    const response = await fetch(`${API_BASE_URL}/api/save-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
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

    // Verify response structure
    if (!result.success) {
      console.error('❌ Request failed - success is not true');
      process.exit(1);
    }

    // Check Supabase result
    if (!result.supabase) {
      console.error('❌ Supabase result is missing!');
      process.exit(1);
    }

    if (Array.isArray(result.supabase) && result.supabase.length > 0) {
      console.log('✅ Supabase: Contact saved successfully');
      console.log(`   Contact ID: ${result.supabase[0].id || 'N/A'}`);
      console.log(`   Email: ${result.supabase[0].email}`);
    } else if (result.supabase && result.supabase.id) {
      console.log('✅ Supabase: Contact saved successfully');
      console.log(`   Contact ID: ${result.supabase.id}`);
      console.log(`   Email: ${result.supabase.email}`);
    } else {
      console.log('⚠️  Supabase: Response received but format unexpected');
      console.log('   Data:', JSON.stringify(result.supabase, null, 2));
    }

    console.log('');

    // Check GoHighLevel result
    if (result.ghlError) {
      console.log('⚠️  GoHighLevel: Error occurred');
      console.log(`   Error: ${result.ghlError.message}`);
      if (result.ghlError.status) {
        console.log(`   Status: ${result.ghlError.status}`);
      }
      console.log('');
      console.log('⚠️  Note: Supabase succeeded, but GoHighLevel failed.');
      console.log('   This is expected behavior - GHL errors should not block Supabase.');
    } else if (result.ghl) {
      console.log('✅ GoHighLevel: Contact sent successfully');
      console.log('   Response:', JSON.stringify(result.ghl, null, 2));
    } else {
      console.log('⚠️  GoHighLevel: No result (may not have been called or returned null)');
    }

    console.log('\n✅ Test completed!');
    console.log('\n📊 Summary:');
    console.log(`   Supabase: ${result.supabase ? '✅ Success' : '❌ Failed'}`);
    console.log(`   GoHighLevel: ${result.ghl ? '✅ Success' : result.ghlError ? '⚠️  Error (logged)' : '⚠️  Unknown'}`);

    if (result.supabase && result.ghl) {
      console.log('\n🎉 Both integrations working correctly!');
    } else if (result.supabase) {
      console.log('\n✅ Supabase working. Check GoHighLevel configuration if needed.');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure your server is running:');
      console.error('   npm run server');
      console.error(`   or check if it's running on ${API_BASE_URL}`);
    }
    process.exit(1);
  }
}

// Run the test
testSaveContact();
