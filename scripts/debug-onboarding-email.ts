
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function run() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching most recent business profile...');
    const { data: profiles, error } = await supabase
        .from('business_profiles')
        .select('user_id, business_name')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !profiles || profiles.length === 0) {
        console.error('Failed to fetch profile:', error);
        process.exit(1);
    }

    const profile = profiles[0];
    console.log(`Found profile for user ${profile.user_id} (${profile.business_name})`);

    console.log('Triggering onboarding email...');
    try {
        const response = await fetch('http://localhost:3001/api/documents/onboarding-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.user_id })
        });

        if (!response.ok) {
            console.error(`Status ${response.status}: ${response.statusText}`);
            const text = await response.text();
            console.error('Body:', text);
        } else {
            const data = await response.json();
            console.log('Success:', data);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
