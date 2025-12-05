/**
 * Test GoHighLevel API with locationId to verify it works
 */

const PIT_TOKEN = 'pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb';
const LOCATION_ID = '7HUNbHEuRf1cXZD4hxxr';

async function testGHLWithLocation() {
  console.log('🧪 Testing GoHighLevel API with locationId...\n');

  const timestamp = Date.now();
  const testContact = {
    firstName: 'Test',
    lastName: `User ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    phone: `555${timestamp.toString().slice(-7)}`,
    locationId: LOCATION_ID,
    tags: ['ricki new funnel'],
    source: 'Cynthia AI',
  };

  console.log('📝 Test Contact:');
  console.log(JSON.stringify(testContact, null, 2));
  console.log('');

  try {
    console.log('🚀 Sending request to GoHighLevel API...\n');

    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIT_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContact),
    });

    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log('Response:', responseText);
    console.log('');

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ SUCCESS! Contact created in GoHighLevel');
      console.log('Contact ID:', result.contact?.id || result.id || 'N/A');
      console.log('Email:', result.contact?.email || result.email || testContact.email);
      console.log('');
      console.log('🎉 Check your GoHighLevel account - the contact should be there!');
    } else {
      const error = JSON.parse(responseText);
      console.error('❌ Error:', error.message || error);
      if (error.statusCode === 403) {
        console.error('   This usually means:');
        console.error('   - The PIT token doesn\'t have access to this location');
        console.error('   - The locationId is incorrect');
        console.error('   - The token needs additional permissions');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testGHLWithLocation();
