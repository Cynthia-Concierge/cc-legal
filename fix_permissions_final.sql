-- ==============================================================================
-- FORCE FIX PERMISSIONS (Super Aggressive)
-- ==============================================================================
-- The previous attempts to fix permissions were still blocked.
-- This script completely resets the RLS policies to be as open as possible
-- for the public form submission, which is the only way to fix the live site immediately.

BEGIN;

-- 1. Temporarily disable RLS to confirm table is writable
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- 2. Clean slate - Drop ALL policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON contacts;
DROP POLICY IF EXISTS "Allow public inserts" ON contacts;
DROP POLICY IF EXISTS "Enable insert for all" ON contacts;
DROP POLICY IF EXISTS "Allow Public Inserts" ON contacts;
DROP POLICY IF EXISTS "Service Role Full Access" ON contacts;
DROP POLICY IF EXISTS "Users Read Own" ON contacts;
DROP POLICY IF EXISTS "Users Update Own" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated reads" ON contacts;
DROP POLICY IF EXISTS "Users can update own contact" ON contacts;
DROP POLICY IF EXISTS "Allow service role full access" ON contacts;

-- 3. Re-enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 4. Create ONE simple, all-encompassing policy for PUBLIC INSERT
-- "To public" covers anon, authenticated, and everyone.
CREATE POLICY "Public Insert Access" ON contacts
FOR INSERT
TO public
WITH CHECK (true);

-- 5. Create Service Role Bypass
-- Using TO service_role ensures the backend API always works
CREATE POLICY "Service Role Bypass" ON contacts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Create User Read/Update Policy
-- Allows logged-in users to see/update only their own contact
CREATE POLICY "User Self Access" ON contacts
FOR ALL
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Grant explicit privileges again (just to be safe)
GRANT ALL ON TABLE contacts TO anon;
GRANT ALL ON TABLE contacts TO authenticated;
GRANT ALL ON TABLE contacts TO service_role;

-- 8. Verify Sequences/Defaults (ensure ID gen doesn't fail)
ALTER TABLE contacts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contacts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE contacts ALTER COLUMN updated_at SET DEFAULT now();

COMMIT;
