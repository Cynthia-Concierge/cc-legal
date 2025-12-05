/**
 * Test script to verify Firecrawl API is working
 * This tests the API key and a simple scrape operation
 * 
 * Usage: node test-firecrawl.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.FIRECRAWL_API_KEY;
const BASE_URL = 'https://api.firecrawl.dev/v1';

if (!API_KEY) {
  console.log('❌ FIRECRAWL_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🧪 Testing Firecrawl API');
console.log('========================================\n');
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Base URL: ${BASE_URL}\n`);

// Test with a simple, reliable website
const testUrl = 'https://example.com';

console.log('📤 Testing scrape endpoint...');
console.log(`   URL: ${testUrl}\n`);

try {
  const response = await fetch(`${BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      url: testUrl,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Failed to parse response as JSON');
    console.error('Response:', responseText);
    process.exit(1);
  }

  console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`);

  if (response.ok) {
    if (data.success && data.data) {
      console.log('✅ SUCCESS! Firecrawl API is working correctly');
      console.log(`   Success: ${data.success}`);
      console.log(`   URL: ${data.data.url || testUrl}`);
      console.log(`   Content length: ${data.data.markdown?.length || 0} characters`);
      console.log(`   Has markdown: ${!!data.data.markdown}`);
      console.log('\n📋 Sample content (first 200 chars):');
      if (data.data.markdown) {
        console.log(data.data.markdown.substring(0, 200) + '...');
      }
    } else {
      console.log('⚠️  Response OK but unexpected format');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } else {
    console.log('❌ FAILED - Firecrawl API returned an error\n');
    
    if (response.status === 401) {
      console.log('🔐 Authentication Error (401)');
      console.log('   Possible issues:');
      console.log('   - API key is incorrect or expired');
      console.log('   - API key format is wrong');
      console.log('   - Check your Firecrawl account settings');
    } else if (response.status === 402) {
      console.log('💳 Payment Required (402)');
      console.log('   Possible issues:');
      console.log('   - Subscription/plan limits exceeded');
      console.log('   - Billing issue - payment method expired');
      console.log('   - Account suspended due to payment');
      console.log('   - Need to upgrade plan for more credits');
      console.log('\n   💡 Action required:');
      console.log('   - Check your Firecrawl dashboard for billing status');
      console.log('   - Verify your subscription is active');
      console.log('   - Check if you have remaining credits');
    } else if (response.status === 429) {
      console.log('⏱️  Rate Limit Exceeded (429)');
      console.log('   - Too many requests');
      console.log('   - Wait a bit and try again');
    } else if (response.status === 400) {
      console.log('⚠️  Bad Request (400)');
      console.log('   - Check URL format');
      console.log('   - Verify request parameters');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
    
    console.log('\n📋 Error Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.log(`\n❌ Error message: ${data.error}`);
    }
    if (data.message) {
      console.log(`❌ Message: ${data.message}`);
    }
  }

} catch (error) {
  console.error('❌ Network Error:');
  console.error(`   ${error.message}`);
  console.error('\n💡 Make sure:');
  console.error('   - You have internet connection');
  console.error('   - Firecrawl API is accessible');
}
