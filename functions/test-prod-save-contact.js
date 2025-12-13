import fetch from 'node-fetch';

const BASE_URL = 'https://cc-legal.web.app/api';

async function testEndpoints() {
    console.log('Testing endpoints...');

    // 1. Test Health
    try {
        console.log(`\nTesting ${BASE_URL}/health...`);
        const healthRes = await fetch(`${BASE_URL}/health`);
        console.log(`Status: ${healthRes.status}`);
        console.log(`Body: ${await healthRes.text()}`);
    } catch (e) {
        console.error('Health check failed:', e);
    }

    // 2. Test Save Contact
    const testEmail = `test.user.${Date.now()}@example.com`;
    console.log(`\nTesting ${BASE_URL}/save-contact with email: ${testEmail}`);

    try {
        const response = await fetch(`${BASE_URL}/save-contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User Agent',
                email: testEmail,
                phone: '5551234567',
                website: 'https://example.com'
            }),
        });

        console.log(`Response Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response Body: ${text}`);

    } catch (error) {
        console.error('Save contact test failed:', error);
    }
}

testEndpoints();
