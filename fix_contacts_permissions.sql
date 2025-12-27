-- ==============================================================================
-- Fix Permissions & RLS (Critical Fix)
-- ==============================================================================
-- The previous test showed that while Service Role can insert, Anonymous (public)
-- inserts were being blocked by Row Level Security (RLS).
-- This script explicitly grants permissions and sets a permissive insert policy.

BEGIN;

-- 1. Ensure RLS is enabled (safest default)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 2. Grant explicit table privileges to the 'anon' and 'authenticated' roles
-- This is often missed but required for RLS to even work for these roles
GRANT INSERT, SELECT, UPDATE ON TABLE contacts TO anon;
GRANT INSERT, SELECT, UPDATE ON TABLE contacts TO authenticated;
GRANT ALL ON TABLE contacts TO service_role;

-- 3. Drop existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous inserts" ON contacts;
DROP POLICY IF EXISTS "Allow public inserts" ON contacts;
DROP POLICY IF EXISTS "Enable insert for all" ON contacts;

-- 4. Create a single, clear policy for Public Inserts
-- "public" role includes both 'anon' and 'authenticated'
CREATE POLICY "Allow Public Inserts" ON contacts
FOR INSERT
TO public
WITH CHECK (true);

-- 5. Ensure Service Role has full access (bypass RLS)
DROP POLICY IF EXISTS "Service Role Full Access" ON contacts;
CREATE POLICY "Service Role Full Access" ON contacts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Ensure Users can read/update their own contacts
DROP POLICY IF EXISTS "Users Read Own" ON contacts;
CREATE POLICY "Users Read Own" ON contacts
FOR SELECT
TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Update Own" ON contacts;
CREATE POLICY "Users Update Own" ON contacts
FOR UPDATE
TO public
USING (auth.uid() = user_id);

COMMIT;
