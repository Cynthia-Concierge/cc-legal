-- ============================================
-- Add Legal Health Score Email Tracking Field
-- ============================================
-- This migration adds a timestamp field to track when the
-- Legal Health Score email (Day 1 nurture) was sent to users

-- Add the tracking column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS legal_health_score_email_sent_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN users.legal_health_score_email_sent_at IS 'Timestamp when the Legal Health Score email was sent (Day 1 nurture sequence)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_legal_health_score_email_sent_at
  ON users(legal_health_score_email_sent_at);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added legal_health_score_email_sent_at tracking field to users table';
END $$;
