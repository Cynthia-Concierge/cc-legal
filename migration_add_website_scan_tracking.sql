-- ============================================
-- Migration: Add Website Scan Tracking to business_profiles
-- ============================================
-- This migration adds fields to track whether users have scanned their website
-- Run this in Supabase SQL Editor

-- Step 1: Add has_scanned_website column
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS has_scanned_website BOOLEAN DEFAULT false;

-- Step 2: Add website_scan_completed_at timestamp
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS website_scan_completed_at TIMESTAMPTZ;

-- Step 2b: Add field to track if reminder email was sent (prevent duplicate emails)
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS website_scan_reminder_sent_at TIMESTAMPTZ;

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_has_scanned_website 
ON business_profiles(has_scanned_website) 
WHERE has_scanned_website = false;

-- Step 4: Add comments
COMMENT ON COLUMN business_profiles.has_scanned_website IS 'Whether the user has completed a website compliance scan';
COMMENT ON COLUMN business_profiles.website_scan_completed_at IS 'Timestamp when the website scan was completed';
COMMENT ON COLUMN business_profiles.website_scan_reminder_sent_at IS 'Timestamp when the website scan reminder email was sent (prevents duplicate emails)';

-- Step 5: Show summary
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE has_scanned_website = true) as profiles_with_scan,
  COUNT(*) FILTER (WHERE has_scanned_website = false OR has_scanned_website IS NULL) as profiles_without_scan,
  COUNT(*) FILTER (WHERE website_url IS NOT NULL AND website_url != '') as profiles_with_website
FROM business_profiles;

