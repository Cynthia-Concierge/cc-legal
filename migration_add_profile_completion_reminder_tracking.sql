-- ============================================
-- Migration: Add Profile Completion Reminder Tracking to users
-- ============================================
-- This migration adds a timestamp field to track when the
-- Profile Completion Reminder email was sent to users.
-- Run this in the Supabase SQL Editor.

-- Step 1: Add tracking column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_completion_reminder_sent_at TIMESTAMPTZ;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN users.profile_completion_reminder_sent_at IS 'Timestamp when the profile completion reminder email was sent (prevents duplicate emails)';

-- Step 3: Create index for efficient querying (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_profile_completion_reminder_sent_at
  ON users(profile_completion_reminder_sent_at);

-- Step 4: Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added profile_completion_reminder_sent_at tracking field to users table';
END $$;

















