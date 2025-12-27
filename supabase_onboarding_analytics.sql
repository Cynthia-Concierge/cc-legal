-- ============================================
-- Onboarding Analytics Table
-- ============================================
-- This table tracks step-by-step progress through the onboarding flow
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the onboarding_events table
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- Unique session identifier (stored in localStorage)
  email TEXT, -- Email if available
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Event details
  step_number INTEGER NOT NULL, -- 0=welcome, 1=email, 2-10=questions, 11=summary, etc.
  step_name TEXT NOT NULL, -- Human-readable step name
  event_type TEXT NOT NULL, -- 'started', 'completed', 'abandoned'
  
  -- Entry point tracking
  entry_point TEXT, -- 'landing_page' or 'onboarding_direct'
  source TEXT, -- From contacts.source field
  
  -- Timing
  time_spent_seconds INTEGER, -- Time spent on this step (if completed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_events_session_id ON onboarding_events(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_email ON onboarding_events(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_step_number ON onboarding_events(step_number);

-- Step 3: Add table comment
COMMENT ON TABLE onboarding_events IS 'Tracks step-by-step progress through onboarding flow for analytics';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy to allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts" ON onboarding_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 6: Create policy to allow service role and authenticated users to read
CREATE POLICY "Allow authenticated reads" ON onboarding_events
  FOR SELECT
  TO authenticated, service_role
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Step 7: Create helpful views for analytics

-- View: Onboarding Funnel Summary
CREATE OR REPLACE VIEW onboarding_funnel_summary AS
SELECT 
  step_number,
  step_name,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started') as started_count,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'completed') as completed_count,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'abandoned') as abandoned_count,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'completed')::numeric / 
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started'), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(time_spent_seconds) FILTER (WHERE event_type = 'completed'), 2) as avg_time_seconds
FROM onboarding_events
GROUP BY step_number, step_name
ORDER BY step_number;

-- View: Completion Rates by Entry Point
CREATE OR REPLACE VIEW onboarding_completion_by_source AS
SELECT 
  entry_point,
  source,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT session_id) FILTER (
    WHERE step_number = 19 AND event_type = 'completed'
  ) as completed_onboarding,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (
      WHERE step_number = 19 AND event_type = 'completed'
    )::numeric / 
    NULLIF(COUNT(DISTINCT session_id), 0) * 100, 
    2
  ) as completion_rate_percent
FROM onboarding_events
GROUP BY entry_point, source;

-- View: Drop-off Points (where people abandon)
CREATE OR REPLACE VIEW onboarding_dropoff_points AS
SELECT 
  step_number,
  step_name,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'abandoned') as abandoned_count,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started') as started_count,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'abandoned')::numeric / 
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started'), 0) * 100, 
    2
  ) as dropoff_rate_percent
FROM onboarding_events
WHERE event_type IN ('started', 'abandoned')
GROUP BY step_number, step_name
HAVING COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'abandoned') > 0
ORDER BY abandoned_count DESC;
