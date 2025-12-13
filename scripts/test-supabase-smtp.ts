
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase Admin client
const supabaseUrl = process.env.SUPABASE_URL || 'https://pwwdihmajwbhrjmfathm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSmtpConnection() {
    console.log('Testing Supabase SMTP connection...');
    console.log('Sending test password reset email to: rickibodner@gmail.com');

    const { data, error } = await supabase.auth.admin.inviteUserByEmail('rickibodner@gmail.com');

    // Alternatively, if the user already exists, we can use resetPasswordForEmail
    // But invite is often cleaner for "admin" initiated tests.
    // Let's try resetPasswordForEmail effectively since you just want to test delivery.

    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail('rickibodner@gmail.com', {
        redirectTo: 'https://cynthiaconcierge.com/reset-password',
    });

    if (resetError) {
        console.error('❌ Failed to trigger email via Supabase:', resetError.message);

        // Common SMTP related errors usually show up here if Supabase fails to hand off
        if (resetError.message.includes('SMTP')) {
            console.error('   -> This confirms an issue with the SMTP credentials.');
        }
    } else {
        console.log('✅ Success! Supabase accepted the request.');
        console.log('   -> If your SMTP settings are correct, you should receive an email shortly.');
        console.log('   -> If you do NOT receive it, check your Supabase Auth Logs for SMTP errors.');
    }
}

testSmtpConnection();
