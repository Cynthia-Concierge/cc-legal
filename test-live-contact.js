#!/usr/bin/env node

const API_URL = 'https://cc-legal.web.app/api/save-contact';

async function testContact(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Phone: "${testCase.data.phone}"`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase.data)
    });

    const result = await response.json();

    if (result.success) {
      console.log(`   ✅ SUCCESS`);
    } else {
      console.log(`   ❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

async function runTests() {
  const timestamp = Date.now();

  const tests = [
    {
      name: 'Empty phone (should work)',
      data: {
        name: 'Test No Phone',
        email: `no-phone-${timestamp}@example.com`,
        phone: '',
        website: 'https://test.com',
        source: 'debug'
      }
    },
    {
      name: 'Valid US phone (should work)',
      data: {
        name: 'Test Valid Phone',
        email: `valid-phone-${timestamp}@example.com`,
        phone: '+12025551234',
        website: 'https://test.com',
        source: 'debug'
      }
    },
    {
      name: 'Invalid phone format (should fail)',
      data: {
        name: 'Test Invalid Phone',
        email: `invalid-phone-${timestamp}@example.com`,
        phone: '+15551234567',
        website: 'https://test.com',
        source: 'debug'
      }
    },
    {
      name: 'Phone without country code (should work if validation handles it)',
      data: {
        name: 'Test No Country Code',
        email: `no-country-${timestamp}@example.com`,
        phone: '5551234567',
        website: 'https://test.com',
        source: 'debug'
      }
    }
  ];

  for (const test of tests) {
    await testContact(test);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
  }

  console.log('\n✅ Testing complete\n');
}

runTests();
