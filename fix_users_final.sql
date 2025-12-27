-- Fix users table RLS - FINAL VERSION
-- Run this in Supabase SQL Editor

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Create the policy
CREATE POLICY "Service role full access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant all permissions to service role
GRANT ALL ON public.users TO service_role;