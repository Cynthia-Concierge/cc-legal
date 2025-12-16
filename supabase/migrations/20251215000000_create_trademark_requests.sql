-- Create trademark_requests table
CREATE TABLE IF NOT EXISTS trademark_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  quiz_score INTEGER,
  risk_level TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trademark_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can insert their own requests
CREATE POLICY "Users can insert their own trademark requests"
  ON trademark_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own trademark requests"
  ON trademark_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for admin/backend processing)
-- (Implicitly true for service_role, but explicit policy often not needed if using service_role key, 
-- but ensuring no restrictive policies block it is good practice, usually handled by bypassing RLS)

-- Create index for faster lookups
CREATE INDEX idx_trademark_requests_user_id ON trademark_requests(user_id);
CREATE INDEX idx_trademark_requests_created_at ON trademark_requests(created_at);
