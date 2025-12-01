-- Quick fix for cold_leads RLS policy
-- Run this in Supabase SQL Editor if imports are being blocked

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous inserts" ON cold_leads;

-- Recreate the policy to allow inserts
CREATE POLICY "Allow anonymous inserts" ON cold_leads
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Alternative: If you want to disable RLS completely for bulk imports
-- Uncomment the line below:
-- ALTER TABLE cold_leads DISABLE ROW LEVEL SECURITY;

