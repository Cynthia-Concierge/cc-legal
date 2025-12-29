/**
 * Test script to verify contact created email is working in production
 * Run with: node test-contact-email-live.js
 * 
 * This will:
 * 1. Create a test contact via the production API
 * 2. Verify the contact was saved
 * 3. Check if email sending was triggered (via logs)
 */

const API_BASE_URL = 'https://cc-legal.web.app/api';

async function testContactEmail() {
  console.log('🧪 Testing Contact Created Email in Production\n');
  console.log(`📍 API URL: ${API_BASE_URL}\n`);

  // Generate unique test data with timestamp
  const timestamp = Date.now();
  const testEmail = `test-email-${timestamp}@test-email-check.com`;
  const testData = {
    name: `Test Email User ${timestamp}`,
    email: testEmail,
    phone: `555-${timestamp.toString().slice(-4)}`,
    website: 'https://test-example.com',
    source: 'wellness'
  };

  console.log('📝 Test Contact Data:');
  console.log(`   Name: ${testData.name}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Phone: ${testData.phone}`);
  console.log(`   Website: ${testData.website}\n`);

  try {
    console.log('🚀 Sending request to /api/save-contact...\n');

    const response = await fetch(`${API_BASE_URL}/save-contact`, {
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
      console.error('\n💡 This might indicate the endpoint is not working correctly.');
      process.exit(1);
    }

    console.log('📦 Response Status:', response.status);
    console.log('📦 Response Body:', JSON.stringify(result, null, 2));
    console.log('');

    // Check if contact was saved
    if (result.supabase && Array.isArray(result.supabase) && result.supabase.length > 0) {
      const contact = result.supabase[0];
      console.log('✅ Contact saved successfully to Supabase');
      console.log(`   Contact ID: ${contact.id}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   Created At: ${contact.created_at}`);
      console.log('');
      
      // Check if contact was created recently (within last minute)
      const createdAt = new Date(contact.created_at);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      
      if (createdAt >= oneMinuteAgo) {
        console.log('✅ Contact is NEW (created within last minute)');
        console.log('   → Email should have been sent!\n');
      } else {
        console.log('⚠️  Contact was created more than 1 minute ago');
        console.log('   → This might be a duplicate, email may not be sent\n');
      }
    } else {
      console.log('⚠️  Unexpected Supabase response format');
      console.log('   Data:', JSON.stringify(result.supabase, null, 2));
    }

    console.log('📋 Next Steps to Verify Email:');
    console.log('');
    console.log('1. Check Firebase Functions Logs:');
    console.log('   firebase functions:log --only api');
    console.log('   Look for: "[Save Contact] ✅ Contact created email sent successfully"');
    console.log('');
    console.log('2. Check Resend Dashboard:');
    console.log('   https://resend.com/emails');
    console.log(`   Look for email to: ${testEmail}`);
    console.log('   Subject: "Your personalized legal documents are ready! 🛡️"');
    console.log('');
    console.log('3. Check the test email inbox:');
    console.log(`   ${testEmail}`);
    console.log('   (If you have access to this email)');
    console.log('');
    console.log('4. Check for errors in logs:');
    console.log('   Look for: "[Save Contact] ❌ Error sending contact created email"');
    console.log('   or: "[Save Contact] ⚠️ Missing required env vars"');
    console.log('');

    if (response.status === 200 || response.status === 201) {
      console.log('✅ API request completed successfully!');
      console.log('   Check the logs above to confirm email was sent.');
    } else {
      console.log(`⚠️  API returned status ${response.status}`);
      console.log('   Check the response body above for errors.');
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
testContactEmail();

