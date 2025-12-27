-- Simple fix for users table RLS
-- Run this in Supabase SQL Editor

-- Add service role full access policy
CREATE POLICY IF NOT EXISTS "Service role full access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant all permissions to service role
GRANT ALL ON public.users TO service_role;