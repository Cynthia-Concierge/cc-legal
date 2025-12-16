-- ============================================
-- Trademark Risk Report Tables Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up tables for trademark risk reports

-- Step 1: Create trademark_requests table
CREATE TABLE IF NOT EXISTS trademark_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  quiz_score INTEGER,
  risk_level TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trademark_requests_user_id ON trademark_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trademark_requests_business_name ON trademark_requests(business_name);
CREATE INDEX IF NOT EXISTS idx_trademark_requests_status ON trademark_requests(status);
CREATE INDEX IF NOT EXISTS idx_trademark_requests_created_at ON trademark_requests(created_at DESC);

-- Step 3: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trademark_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_trademark_requests_updated_at ON trademark_requests;
CREATE TRIGGER update_trademark_requests_updated_at
  BEFORE UPDATE ON trademark_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_trademark_requests_updated_at();

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE trademark_requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policy to allow users to read their own requests
DROP POLICY IF EXISTS "Users can view their own trademark requests" ON trademark_requests;
CREATE POLICY "Users can view their own trademark requests"
  ON trademark_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Step 7: Create policy to allow users to insert their own requests
DROP POLICY IF EXISTS "Users can insert their own trademark requests" ON trademark_requests;
CREATE POLICY "Users can insert their own trademark requests"
  ON trademark_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Create legal_timeline table (optional - for event tracking)
CREATE TABLE IF NOT EXISTS legal_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 9: Create indexes for legal_timeline
CREATE INDEX IF NOT EXISTS idx_legal_timeline_user_id ON legal_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_timeline_event_type ON legal_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_legal_timeline_created_at ON legal_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_timeline_event_data ON legal_timeline USING GIN (event_data);

-- Step 10: Enable RLS for legal_timeline
ALTER TABLE legal_timeline ENABLE ROW LEVEL SECURITY;

-- Step 11: Create policy for legal_timeline
DROP POLICY IF EXISTS "Users can view their own timeline events" ON legal_timeline;
CREATE POLICY "Users can view their own timeline events"
  ON legal_timeline
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own timeline events" ON legal_timeline;
CREATE POLICY "Users can insert their own timeline events"
  ON legal_timeline
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 12: Add table comments
COMMENT ON TABLE trademark_requests IS 'Stores trademark risk report requests from users';
COMMENT ON TABLE legal_timeline IS 'Stores legal events and milestones for user timeline';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Trademark risk report tables created successfully';
END $$;

