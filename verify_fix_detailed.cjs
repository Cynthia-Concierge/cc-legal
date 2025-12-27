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

async function verifyFix() {
    const timestamp = Date.now();
    const testEmail = `verify_fix_${timestamp}@example.com`;

    // Test 1: Service Role (Should always work if table exists)
    console.log(`\n--- Attempting SERVICE ROLE insert: ${testEmail} ---`);
    const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);
    try {
        const { data, error } = await supabaseService
            .from('contacts')
            .insert([{
                email: testEmail,
                name: 'Verification Service',
                source: 'verification_script_srv'
            }])
            .select();

        if (error) {
            console.error('❌ Service Role Insert Failed:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
        } else {
            console.log('✅ Service Role Insert Success!');
            // console.log('Record:', data[0]);
        }
    } catch (err) {
        console.error('❌ Service Role - Unexpected Error:', err.message);
    }

    // Test 2: Anon Role (Previous failure point)
    console.log(`\n--- Attempting ANON insert: ${testEmail}_anon ---`);
    const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);
    try {
        const { data, error } = await supabaseAnon
            .from('contacts')
            .insert([{
                email: `${testEmail.split('@')[0]}_anon@example.com`,
                name: 'Verification Anon',
                source: 'verification_script_anon'
            }])
            .select();

        if (error) {
            console.error('❌ Anon Insert Failed:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
        } else {
            console.log('✅ Anon Insert Success!');
            // console.log('Record:', data[0]);
        }
    } catch (err) {
        console.error('❌ Anon - Unexpected Error:', err.message);
    }
}

verifyFix();
