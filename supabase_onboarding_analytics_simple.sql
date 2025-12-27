-- ============================================
-- Onboarding Analytics Table (Simple Version)
-- ============================================
-- Just ONE table to track step-by-step progress
-- Run this SQL in your Supabase SQL Editor

-- Create the onboarding_events table
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- Unique session identifier
  email TEXT, -- Email if available
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Event details
  step_number INTEGER NOT NULL, -- 0=welcome, 1=email, 2-10=questions, etc.
  step_name TEXT NOT NULL, -- Human-readable step name
  event_type TEXT NOT NULL, -- 'started', 'completed', 'abandoned'
  
  -- Entry point tracking
  entry_point TEXT, -- 'landing_page' or 'onboarding_direct'
  source TEXT, -- From contacts.source field
  
  -- Timing
  time_spent_seconds INTEGER, -- Time spent on this step
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_events_session_id ON onboarding_events(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_email ON onboarding_events(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_step_number ON onboarding_events(step_number);

-- Enable Row Level Security
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts" ON onboarding_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow service role to read all (for analytics)
CREATE POLICY "Allow service role reads" ON onboarding_events
  FOR SELECT
  TO service_role
  USING (true);

-- That's it! Just one table.
-- Query it directly like:
-- SELECT * FROM onboarding_events WHERE step_number = 1;
-- SELECT step_number, COUNT(*) FROM onboarding_events GROUP BY step_number;
