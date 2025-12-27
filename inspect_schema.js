
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

async function inspect() {
    console.log("Inspecting schema...");

    // We can't query information_schema directly with anon key usually, unless exposed.
    // But let's try.
    // If that fails, we can try to select * from contacts limit 1 and see keys.

    // Try contacts
    const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);

    if (contactsError) {
        console.error("Error reading contacts:", contactsError);
    } else {
        console.log("Contacts columns:", contacts.length > 0 ? Object.keys(contacts[0]) : "Table access ok, but empty");
        // If empty, insert dummy to see columns? No.
    }

    // Try users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (usersError) {
        console.error("Error reading users:", usersError);
    } else {
        console.log("Users columns:", users.length > 0 ? Object.keys(users[0]) : "Table access ok, but empty");
    }

    // Check if business_profiles exists
    const { data: bp, error: bpError } = await supabase
        .from('business_profiles')
        .select('*')
        .limit(1);

    if (bpError) {
        console.error("Error reading business_profiles:", bpError);
    } else {
        console.log("Business Profiles columns:", bp.length > 0 ? Object.keys(bp[0]) : "Table access ok, but empty");
    }

}

inspect();
