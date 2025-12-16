
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();
dotenv.config({ path: '.env.local' });

// Try to get service role key first, then anon key (though anon key might not have permission to create tables)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const sql = `
-- Create trademark_requests table
CREATE TABLE IF NOT EXISTS trademark_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  quiz_score INTEGER,
  risk_level TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (idempotent-ish, might fail if already enabled but that's fine)
DO $$
BEGIN
    ALTER TABLE trademark_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'trademark_requests' AND policyname = 'Users can insert their own trademark requests'
    ) THEN
        CREATE POLICY "Users can insert their own trademark requests"
        ON trademark_requests FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'trademark_requests' AND policyname = 'Users can view their own trademark requests'
    ) THEN
        CREATE POLICY "Users can view their own trademark requests"
        ON trademark_requests FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes (idempotent checks)
CREATE INDEX IF NOT EXISTS idx_trademark_requests_user_id ON trademark_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trademark_requests_created_at ON trademark_requests(created_at);
`;

async function runMigration() {
    console.log('Running migration...');

    // Using the rpc/pg-admin pattern if available, or just raw SQL via specific specialized tool if client supports it?
    // Supabase JS client doesn't support raw SQL query execution directly on the public interface usually unless via rpc.
    // HOWEVER, we can use the 'postgres' connection if we had the connection string.
    // BUT, since we might be in an environment where we only have the API...

    // Wait, I can try to use the `supabase-js` client to insert, but I need to CREATE TABLE first.
    // If I can't run SQL, I might need the user to run it in the dashboard.

    // OR, I can use the 'pg' library if I have the DB connection string?
    // Checking .env content (via tool) is not allowed directly for security, but I can check if 'postgres' library is installed?

    // ACTUALLY, usually there is an RPC function for running SQL if this project is set up for it, 
    // OR I can use the `extensions` or just try to use the REST API to see if table exists?
    // But I can't CREATE TABLE via REST API standard client.

    // Let's try to see if `npm run migrate` or similar exists?

    // Fallback: If I can't run it programmatically easily without connection string, 
    // I will ask the user to run it or use a trick if `supabase-cli` was working.
    // `supabase-cli` failed because of `link`. 

    // Let's try to read .env file to see if I have a postgres connection string `DATABASE_URL`.
    // If I have `DATABASE_URL`, I can use `pg` driver.

    // I will write this file to check for DATABASE_URL and if present use `pg` to run the SQL.
    // I'll need to install `pg` if not present.

    if (process.env.DATABASE_URL) {
        console.log('Connecting to database via connection string...');
        const { Client } = require('pg');
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            await client.query(sql);
            console.log('✅ Migration executed successfully via pg client.');
        } catch (e) {
            console.error('Error running SQL via pg:', e);
        } finally {
            await client.end();
        }
        return;
    }

    console.log('⚠️ No DATABASE_URL found. Checking if table exists via Supabase API...');
    const { error } = await supabase.from('trademark_requests').select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') { // undefined_table
        console.error('❌ Table trademark_requests does not exist and I cannot create it without DB access.');
        console.error('Please run the migration SQL in your Supabase Dashboard SQL Editor.');
        console.error(sql);
    } else if (!error) {
        console.log('✅ Table trademark_requests already exists.');
    } else {
        console.error('Error checking table:', error);
    }
}

// I need to install pg if not there. 
// Just in case, I'll use a simple approach. 
runMigration();
