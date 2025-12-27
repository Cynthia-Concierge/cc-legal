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

console.log('Testing with URL:', SUPABASE_URL);

async function verifyFix() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    const timestamp = Date.now();
    const testEmail = `verify_fix_${timestamp}@example.com`;

    console.log(`\n--- Attempting to insert contact: ${testEmail} ---`);

    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                email: testEmail,
                name: 'Verification User',
                phone: '555-0199',
                website: 'https://verification-test.com',
                source: 'verification_script'
            }])
            .select();

        if (error) {
            console.error('❌ Insert Failed:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
        } else {
            console.log('✅ Insert Success!');
            console.log('Inserted Record:', data[0]);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

verifyFix();
