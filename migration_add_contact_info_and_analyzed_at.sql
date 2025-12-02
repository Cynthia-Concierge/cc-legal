-- ============================================
-- Migration: Add organized contact information columns and analyzed_at field
-- ============================================
-- This migration adds:
-- 1. Separate contact information columns to workflow_results table:
--    - scraped_email (primary email)
--    - scraped_emails (all emails as JSONB array)
--    - instagram_url, facebook_url, twitter_url, linkedin_url, tiktok_url
--    - other_social_links (JSONB for other platforms)
-- 2. analyzed_at column to cold_leads table (for tracking which leads have been analyzed)
-- 3. Same contact information columns to cold_leads table (so contact info is in both places)
--
-- Run this SQL in your Supabase SQL Editor if you already have these tables created

-- ============================================
-- Step 1: Add organized contact info columns to workflow_results
-- ============================================
-- Remove old contact_info column if it exists (we're replacing it with organized columns)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE workflow_results DROP COLUMN IF EXISTS contact_info;
    DROP INDEX IF EXISTS idx_workflow_results_contact_info;
    RAISE NOTICE 'Removed old contact_info column from workflow_results table';
  END IF;
END $$;

-- Add scraped_email column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'scraped_email'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN scraped_email TEXT;
    CREATE INDEX IF NOT EXISTS idx_workflow_results_scraped_email ON workflow_results(scraped_email);
    COMMENT ON COLUMN workflow_results.scraped_email IS 'Primary email address scraped from the website';
    RAISE NOTICE 'Added scraped_email column to workflow_results table';
  END IF;
END $$;

-- Add scraped_emails column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'scraped_emails'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN scraped_emails JSONB;
    CREATE INDEX IF NOT EXISTS idx_workflow_results_scraped_emails ON workflow_results USING GIN (scraped_emails);
    COMMENT ON COLUMN workflow_results.scraped_emails IS 'Array of all email addresses found on the website';
    RAISE NOTICE 'Added scraped_emails column to workflow_results table';
  END IF;
END $$;

-- Add instagram_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN instagram_url TEXT;
    CREATE INDEX IF NOT EXISTS idx_workflow_results_instagram_url ON workflow_results(instagram_url);
    COMMENT ON COLUMN workflow_results.instagram_url IS 'Instagram profile URL scraped from the website';
    RAISE NOTICE 'Added instagram_url column to workflow_results table';
  END IF;
END $$;

-- Add facebook_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN facebook_url TEXT;
    COMMENT ON COLUMN workflow_results.facebook_url IS 'Facebook profile/page URL scraped from the website';
    RAISE NOTICE 'Added facebook_url column to workflow_results table';
  END IF;
END $$;

-- Add twitter_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN twitter_url TEXT;
    COMMENT ON COLUMN workflow_results.twitter_url IS 'Twitter/X profile URL scraped from the website';
    RAISE NOTICE 'Added twitter_url column to workflow_results table';
  END IF;
END $$;

-- Add linkedin_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN linkedin_url TEXT;
    COMMENT ON COLUMN workflow_results.linkedin_url IS 'LinkedIn profile/company URL scraped from the website';
    RAISE NOTICE 'Added linkedin_url column to workflow_results table';
  END IF;
END $$;

-- Add tiktok_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'tiktok_url'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN tiktok_url TEXT;
    COMMENT ON COLUMN workflow_results.tiktok_url IS 'TikTok profile URL scraped from the website';
    RAISE NOTICE 'Added tiktok_url column to workflow_results table';
  END IF;
END $$;

-- Add other_social_links column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_results' AND column_name = 'other_social_links'
  ) THEN
    ALTER TABLE workflow_results ADD COLUMN other_social_links JSONB;
    CREATE INDEX IF NOT EXISTS idx_workflow_results_other_social_links ON workflow_results USING GIN (other_social_links);
    COMMENT ON COLUMN workflow_results.other_social_links IS 'JSONB object containing other social media links (YouTube, Pinterest, etc.)';
    RAISE NOTICE 'Added other_social_links column to workflow_results table';
  END IF;
END $$;

-- ============================================
-- Step 2: Add analyzed_at and contact info columns to cold_leads
-- ============================================
-- Add analyzed_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'analyzed_at'
  ) THEN
    ALTER TABLE cold_leads 
    ADD COLUMN analyzed_at TIMESTAMPTZ;
    
    -- Add index for efficient queries
    CREATE INDEX IF NOT EXISTS idx_cold_leads_analyzed_at 
    ON cold_leads(analyzed_at DESC);
    
    RAISE NOTICE 'Added analyzed_at column to cold_leads table';
  ELSE
    RAISE NOTICE 'analyzed_at column already exists in cold_leads table';
  END IF;
END $$;

-- Add scraped_email column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'scraped_email'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN scraped_email TEXT;
    CREATE INDEX IF NOT EXISTS idx_cold_leads_scraped_email ON cold_leads(scraped_email);
    COMMENT ON COLUMN cold_leads.scraped_email IS 'Primary email address scraped from the website during analysis';
    RAISE NOTICE 'Added scraped_email column to cold_leads table';
  END IF;
END $$;

-- Add scraped_emails column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'scraped_emails'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN scraped_emails JSONB;
    COMMENT ON COLUMN cold_leads.scraped_emails IS 'Array of all email addresses found on the website';
    RAISE NOTICE 'Added scraped_emails column to cold_leads table';
  END IF;
END $$;

-- Add instagram_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN instagram_url TEXT;
    CREATE INDEX IF NOT EXISTS idx_cold_leads_instagram_url ON cold_leads(instagram_url);
    COMMENT ON COLUMN cold_leads.instagram_url IS 'Instagram profile URL scraped from the website';
    RAISE NOTICE 'Added instagram_url column to cold_leads table';
  END IF;
END $$;

-- Add facebook_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN facebook_url TEXT;
    COMMENT ON COLUMN cold_leads.facebook_url IS 'Facebook profile/page URL scraped from the website';
    RAISE NOTICE 'Added facebook_url column to cold_leads table';
  END IF;
END $$;

-- Add twitter_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN twitter_url TEXT;
    COMMENT ON COLUMN cold_leads.twitter_url IS 'Twitter/X profile URL scraped from the website';
    RAISE NOTICE 'Added twitter_url column to cold_leads table';
  END IF;
END $$;

-- Add linkedin_url_scraped column (note: different from linkedin_url which is from import)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'linkedin_url_scraped'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN linkedin_url_scraped TEXT;
    COMMENT ON COLUMN cold_leads.linkedin_url_scraped IS 'LinkedIn profile/company URL scraped from the website (different from linkedin_url which is from lead import)';
    RAISE NOTICE 'Added linkedin_url_scraped column to cold_leads table';
  END IF;
END $$;

-- Add tiktok_url column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'tiktok_url'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN tiktok_url TEXT;
    COMMENT ON COLUMN cold_leads.tiktok_url IS 'TikTok profile URL scraped from the website';
    RAISE NOTICE 'Added tiktok_url column to cold_leads table';
  END IF;
END $$;

-- Add other_social_links column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_leads' AND column_name = 'other_social_links'
  ) THEN
    ALTER TABLE cold_leads ADD COLUMN other_social_links JSONB;
    COMMENT ON COLUMN cold_leads.other_social_links IS 'JSONB object containing other social media links (YouTube, Pinterest, etc.)';
    RAISE NOTICE 'Added other_social_links column to cold_leads table';
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
-- Check that columns were added successfully
SELECT 
  'workflow_results' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'workflow_results' 
  AND column_name IN ('scraped_email', 'scraped_emails', 'instagram_url', 'facebook_url', 'twitter_url', 'linkedin_url', 'tiktok_url', 'other_social_links')
UNION ALL
SELECT 
  'cold_leads' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'cold_leads' 
  AND column_name IN ('analyzed_at', 'scraped_email', 'scraped_emails', 'instagram_url', 'facebook_url', 'twitter_url', 'linkedin_url_scraped', 'tiktok_url', 'other_social_links')
ORDER BY table_name, column_name;

