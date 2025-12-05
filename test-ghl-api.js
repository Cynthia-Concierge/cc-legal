/**
 * Test GoHighLevel API directly to see what's needed
 */

const PIT_TOKEN = 'pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb';

async function testGHLAPI() {
  console.log('🧪 Testing GoHighLevel API directly...\n');

  // Test 1: Without locationId (current implementation)
  console.log('📝 Test 1: Without locationId');
  try {
    const response1 = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIT_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: `test-${Date.now()}@example.com`,
        phone: '555-1234',
        tags: ['ricki new funnel'],
        source: 'Cynthia AI',
      }),
    });

    const text1 = await response1.text();
    console.log(`Status: ${response1.status}`);
    console.log('Response:', text1);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('');
  }

  // Test 2: Try to get locations/accounts first
  console.log('📝 Test 2: Try to get account info');
  try {
    const response2 = await fetch('https://services.leadconnectorhq.com/locations/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PIT_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
    });

    const text2 = await response2.text();
    console.log(`Status: ${response2.status}`);
    console.log('Response:', text2);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('');
  }

  // Test 3: Try with a common locationId pattern (might need actual ID)
  console.log('📝 Test 3: With locationId (need actual ID)');
  console.log('Note: We need the actual locationId from your GoHighLevel account');
  console.log('You can find it in: Settings > Integrations > API');
}

testGHLAPI();
