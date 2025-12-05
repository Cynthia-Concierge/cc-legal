/**
 * Detailed Firecrawl test - tests multiple scenarios
 * Tests both simple scrape and full website scrape
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.FIRECRAWL_API_KEY;
const BASE_URL = 'https://api.firecrawl.dev/v1';

if (!API_KEY) {
  console.log('❌ FIRECRAWL_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🧪 Detailed Firecrawl API Test');
console.log('========================================\n');

async function testScrape(url, description, options = {}) {
  console.log(`\n📤 Test: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(`${BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        url: url,
        formats: options.formats || ['markdown'],
        onlyMainContent: options.onlyMainContent !== undefined ? options.onlyMainContent : true,
        ...options,
      }),
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log(`   ❌ Failed to parse response`);
      console.log(`   Response: ${responseText.substring(0, 200)}`);
      return { success: false, status: response.status, error: 'Invalid JSON' };
    }

    if (response.ok) {
      console.log(`   ✅ SUCCESS (${response.status})`);
      if (data.data?.markdown) {
        console.log(`   Content length: ${data.data.markdown.length} chars`);
      }
      return { success: true, status: response.status, data };
    } else {
      console.log(`   ❌ FAILED (${response.status})`);
      if (response.status === 402) {
        console.log(`   💳 Payment Required - Credits may be exhausted`);
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication failed`);
      } else if (response.status === 429) {
        console.log(`   ⏱️  Rate limit exceeded`);
      }
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
      if (data.message) {
        console.log(`   Message: ${data.message}`);
      }
      return { success: false, status: response.status, error: data.error || data.message };
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run tests
const results = [];

// Test 1: Simple scrape (markdown only)
results.push(await testScrape('https://example.com', 'Simple scrape (markdown)', {
  formats: ['markdown'],
  onlyMainContent: true,
}));

// Test 2: Scrape with HTML (like the service does for social media)
results.push(await testScrape('https://example.com', 'Scrape with HTML (for footer/social)', {
  formats: ['html', 'markdown'],
  onlyMainContent: false,
}));

// Test 3: Test with a real website (if you want)
// results.push(await testScrape('https://www.apple.com', 'Real website test'));

// Summary
console.log('\n\n📊 Test Summary');
console.log('========================================');
const successCount = results.filter(r => r.success).length;
const failCount = results.filter(r => !r.success).length;

console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);

if (failCount > 0) {
  console.log('\n❌ Failures:');
  results.forEach((result, index) => {
    if (!result.success) {
      console.log(`   Test ${index + 1}: Status ${result.status || 'N/A'} - ${result.error || 'Unknown error'}`);
    }
  });
  
  const has402 = results.some(r => r.status === 402);
  if (has402) {
    console.log('\n💡 402 Payment Required errors indicate:');
    console.log('   - Your Firecrawl credits/usage limit has been exceeded');
    console.log('   - Check your Firecrawl dashboard for billing/credits status');
    console.log('   - You may need to upgrade your plan or wait for credit reset');
  }
} else {
  console.log('\n✅ All tests passed! Firecrawl API is working correctly.');
}
