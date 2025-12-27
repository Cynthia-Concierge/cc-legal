
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole(email: string) {
    console.log(`Checking role for user: ${email}`);

    // First get the user from auth (to get the ID)
    // Admin API required for this, or we can look up by email in users table directly if we trust it
    // But let's check the users table directly first as that's what we added

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError) {
        console.error('Error fetching user from users table:', userError);
        return;
    }

    if (!userData) {
        console.log('User not found in users table.');
        return;
    }

    console.log('User found in users table:');
    console.log(`ID: ${userData.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Role: '${userData.role}'`); // Enclose in quotes to reveal whitespace issues
    console.log(`Subscription Status: ${userData.subscription_status}`);
}

checkUserRole('rickibodner@gmail.com');
