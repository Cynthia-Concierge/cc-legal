-- ============================================
-- Add Admin Access to Onboarding Events
-- ============================================
-- This allows admins to view all onboarding_events for analytics
-- Run this in your Supabase SQL Editor

-- Ensure is_admin function exists (should already exist from fix_admin_rls_policies.sql)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy to allow admins to read all onboarding_events
-- This is needed for the analytics views to work for admins
DROP POLICY IF EXISTS "Admins can view all onboarding events" ON onboarding_events;

CREATE POLICY "Admins can view all onboarding events" ON onboarding_events
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Note: Views inherit RLS from underlying tables, so this policy
-- will allow admins to query the analytics views:
-- - onboarding_funnel_summary
-- - onboarding_dropoff_points  
-- - onboarding_completion_by_source

