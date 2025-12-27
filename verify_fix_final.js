
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

async function verify() {
    const email = `verify-${Date.now()}@example.com`;
    // ... rest of logic
    const password = 'VerifyPassword123!@';

    console.log(`\n🔍 Verifying fix with user: ${email}...`);

    // 1. SignUp
    console.log("1. SignUp (temp_password: true)...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                temp_password: true,
                name: 'Verify User'
            }
        }
    });

    if (signUpError) {
        console.error("❌ SignUp Failed:", signUpError.message);
        process.exit(1);
    }
    console.log("✅ SignUp Succeeded.");

    // 2. SignIn (if needed)
    let session = signUpData.session;
    if (!session) {
        console.log("   (Signing in to get session...)");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.error("❌ SignIn Failed:", signInError.message);
            process.exit(1);
        }
        session = signInData.session;
    }

    // 3. UpdateUser
    console.log("2. UpdateUser (temp_password: false)...");
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: 'NewVerifyPassword123!',
        data: {
            temp_password: false
        }
    });

    if (updateError) {
        console.error("❌ UpdateUser Failed:", updateError.message);
        console.error("   Please run the emergency SQL script.");
        process.exit(1);
    }
    console.log("✅ UpdateUser Succeeded! (Login unblocked)");

    // 4. Verify public.users
    console.log("3. Verifying public.users table...");
    if (session) {
        const authenticatedClient = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            }
        });

        const { data: userData, error: userError } = await authenticatedClient
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (userError) {
            console.warn("⚠️ Could not verify public.users entry:", userError.message);
        } else if (userData) {
            console.log("✅ User found in public.users table!", userData);
            console.log("\n🎉 FULL SUCCESS.");
        } else {
            console.warn("⚠️ User NOT found in public.users table.");
            console.log("\n🎉 PARTIAL SUCCESS: Login works, profile data sync silently failed.");
        }
    }
}

verify();
