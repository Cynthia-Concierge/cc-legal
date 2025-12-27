-- Fix Users Table RLS - Add Service Role INSERT Policy
-- This allows the backend and triggers to insert users

BEGIN;

-- Add service role INSERT policy (this was missing!)
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure service role has ALL permissions on the table
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions (just to be safe)
GRANT ALL ON public.users TO service_role;

COMMIT;

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
