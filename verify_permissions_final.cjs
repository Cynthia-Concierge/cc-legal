const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const ANON_KEY = env.SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing with URL:', SUPABASE_URL);

// Test Public (Anon) Insert - This simulates the frontend form
async function testPublicInsert() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    console.log('\n--- Testing PUBLIC (Anon) Insert ---');

    const timestamp = Date.now();
    const testEmail = `public_test_${timestamp}@example.com`;

    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                email: testEmail,
                name: 'Public Test User',
                phone: '555-0001',
                website: 'https://public-test.com',
                source: 'verification_script_public'
            }])
            .select();

        if (error) {
            console.error('❌ Public Insert Failed:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
        } else {
            console.log('✅ Public Insert Success!');
            console.log('Record ID:', data[0].id);
        }
    } catch (err) {
        console.error('❌ Public - Unexpected Error:', err.message);
    }
}

// Test Service Role Insert - This simulates the backend API
async function testServiceInsert() {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    console.log('\n--- Testing SERVICE ROLE Insert ---');

    const timestamp = Date.now();
    const testEmail = `service_test_${timestamp}@example.com`;

    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                email: testEmail,
                name: 'Service Role User',
                phone: '555-0002',
                website: 'https://service-test.com',
                source: 'verification_script_service'
            }])
            .select();

        if (error) {
            console.error('❌ Service Role Insert Failed:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
        } else {
            console.log('✅ Service Role Insert Success!');
            console.log('Record ID:', data[0].id);
        }
    } catch (err) {
        console.error('❌ Service Role - Unexpected Error:', err.message);
    }
}

async function run() {
    await testPublicInsert();
    await testServiceInsert();
}

run();
