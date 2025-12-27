
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing service key credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debug() {
    console.log("🛠️ Debugging with Service Role Key...");

    const testId = '00000000-0000-0000-0000-000000000001';

    // 1. Try to clean up from previous run
    await supabase.from('users').delete().eq('user_id', testId);

    // 2. Try inserting into users table directly
    console.log("\n1. Testing insert into public.users...");
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            user_id: testId,
            email: 'service-key-test@example.com',
            name: 'Service Key Test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_completed: false,
            profile_completed: false
        })
        .select();

    if (userError) {
        console.error("❌ Insert into public.users FAILED:", userError);
    } else {
        console.log("✅ Insert into public.users SUCCESS:", userData);
        // Clean up
        await supabase.from('users').delete().eq('user_id', testId);
    }

    // 3. Try inserting into contacts table directly
    console.log("\n2. Testing insert into public.contacts...");
    const contactEmail = 'service-contact-test@example.com';
    // cleanup
    await supabase.from('contacts').delete().eq('email', contactEmail);

    const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .insert({
            email: contactEmail,
            name: 'Service Contact',
            source: 'debug_script'
        })
        .select();

    if (contactError) {
        console.error("❌ Insert into public.contacts FAILED:", contactError);
    } else {
        console.log("✅ Insert into public.contacts SUCCESS:", contactData);
        // Clean up
        await supabase.from('contacts').delete().eq('email', contactEmail);
    }

    console.log("\nDone.");
}

debug();
