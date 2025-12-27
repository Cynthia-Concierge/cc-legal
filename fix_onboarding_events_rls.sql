-- Fix RLS Policies for onboarding_events table
-- This ensures tracking works properly and admins can view analytics

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts" ON onboarding_events;
DROP POLICY IF EXISTS "Allow authenticated reads" ON onboarding_events;

-- Policy 1: Allow anonymous and authenticated users to INSERT (for tracking)
CREATE POLICY "Allow anonymous inserts" ON onboarding_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow service role to read ALL events (for analytics/admin)
CREATE POLICY "Allow service role reads" ON onboarding_events
  FOR SELECT
  TO service_role
  USING (true);

-- Policy 3: Allow authenticated users to read their own events (optional, for user dashboard)
CREATE POLICY "Allow users to read own events" ON onboarding_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy 4: Allow anonymous reads for events without user_id (for analytics)
-- This allows viewing aggregated data even when not logged in
CREATE POLICY "Allow anonymous reads for analytics" ON onboarding_events
  FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Add comment
COMMENT ON POLICY "Allow anonymous inserts" ON onboarding_events IS 
  'Allows tracking events from anonymous users during onboarding';

COMMENT ON POLICY "Allow service role reads" ON onboarding_events IS 
  'Allows service role (admin) to read all events for analytics';
