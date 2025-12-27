-- ================================================================
-- Migration: Add Nurture Sequence Email Tracking Fields
-- ================================================================
-- Adds tracking fields to users table to prevent duplicate emails
-- for the nurture sequence (Day 3, 5, 7, 10 emails)
--
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add tracking columns for nurture sequence emails
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS case_study_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS risk_scenario_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS social_proof_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_reminder_email_sent_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_case_study_email_sent_at 
ON users(case_study_email_sent_at) 
WHERE case_study_email_sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_risk_scenario_email_sent_at 
ON users(risk_scenario_email_sent_at) 
WHERE risk_scenario_email_sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_social_proof_email_sent_at 
ON users(social_proof_email_sent_at) 
WHERE social_proof_email_sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_final_reminder_email_sent_at 
ON users(final_reminder_email_sent_at) 
WHERE final_reminder_email_sent_at IS NOT NULL;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN (
    'case_study_email_sent_at',
    'risk_scenario_email_sent_at',
    'social_proof_email_sent_at',
    'final_reminder_email_sent_at'
  )
ORDER BY column_name;

