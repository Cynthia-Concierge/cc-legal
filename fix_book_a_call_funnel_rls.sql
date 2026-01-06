-- ============================================
-- Fix: Update RLS policy for book_a_call_funnel
-- ============================================
-- Run this SQL in your Supabase SQL Editor to fix the form submission issue

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow anonymous inserts" ON book_a_call_funnel;

-- Recreate the policy with service_role included
CREATE POLICY "Allow anonymous inserts" ON book_a_call_funnel
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'book_a_call_funnel';
