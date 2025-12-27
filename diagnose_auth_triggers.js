
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlow() {
    const email = `diag-${Date.now()}@example.com`;
    const password = 'TestPassword123!@';

    console.log(`Testing flow for ${email}...`);

    // 1. SignUp with temp_password: true
    console.log("1. running signUp (temp_password: true)...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                temp_password: true,
                name: 'Diag User'
            }
        }
    });

    if (signUpError) {
        console.error("❌ SignUp Failed:", signUpError);
        return; // Stop here
    }
    console.log("✅ SignUp Succeeded. User ID:", signUpData.user.id);

    // 2. Check if contact was linked? (Can't check directly without admin key, skipping)

    // 3. Update User (模拟 setting real password)
    // This should trigger the handle_auth_user_created trigger to insert into public.users
    console.log("3. running updateUser (temp_password: false)...");

    // We need to sign in first? signUp automatically signs in if auto-confirm is on.
    // If not, we might need to verify email.

    if (!signUpData.session) {
        console.log("⚠️ No session from signUp. Attempting signIn...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.error("❌ SignIn Failed:", signInError);
            return;
        }
    }

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: 'NewPassword123!@',
        data: {
            temp_password: false
        }
    });

    if (updateError) {
        console.error("❌ UpdateUser Failed:", updateError);
        console.log("   -> This implies public.users trigger failed.");
    } else {
        console.log("✅ UpdateUser Succeeded.");
        console.log("   -> This implies public.users trigger worked.");
    }
}

testFlow();
