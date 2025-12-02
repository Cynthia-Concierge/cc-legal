-- ============================================
-- Workflow Results Table Setup
-- ============================================
-- This table stores results from the Legal Analyzer workflow
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the workflow_results table
CREATE TABLE IF NOT EXISTS workflow_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_url TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  lead_email TEXT,
  legal_documents JSONB,
  analysis JSONB,
  scraped_email TEXT,
  scraped_emails JSONB,
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  tiktok_url TEXT,
  other_social_links JSONB,
  email_subject TEXT,
  email_body TEXT,
  execution_details JSONB,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_results_website_url ON workflow_results(website_url);
CREATE INDEX IF NOT EXISTS idx_workflow_results_lead_email ON workflow_results(lead_email);
CREATE INDEX IF NOT EXISTS idx_workflow_results_scraped_email ON workflow_results(scraped_email);
CREATE INDEX IF NOT EXISTS idx_workflow_results_instagram_url ON workflow_results(instagram_url);
CREATE INDEX IF NOT EXISTS idx_workflow_results_created_at ON workflow_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_results_status ON workflow_results(status);

-- Step 3: Create GIN indexes for JSONB columns (for efficient JSON queries)
CREATE INDEX IF NOT EXISTS idx_workflow_results_legal_documents ON workflow_results USING GIN (legal_documents);
CREATE INDEX IF NOT EXISTS idx_workflow_results_analysis ON workflow_results USING GIN (analysis);
CREATE INDEX IF NOT EXISTS idx_workflow_results_scraped_emails ON workflow_results USING GIN (scraped_emails);
CREATE INDEX IF NOT EXISTS idx_workflow_results_other_social_links ON workflow_results USING GIN (other_social_links);

-- Step 4: Add table comment
COMMENT ON TABLE workflow_results IS 'Stores results from Legal Analyzer workflow - website scraping, legal analysis, contact information, and generated emails';
COMMENT ON COLUMN workflow_results.scraped_email IS 'Primary email address scraped from the website';
COMMENT ON COLUMN workflow_results.scraped_emails IS 'Array of all email addresses found on the website';
COMMENT ON COLUMN workflow_results.instagram_url IS 'Instagram profile URL scraped from the website';
COMMENT ON COLUMN workflow_results.facebook_url IS 'Facebook profile/page URL scraped from the website';
COMMENT ON COLUMN workflow_results.twitter_url IS 'Twitter/X profile URL scraped from the website';
COMMENT ON COLUMN workflow_results.linkedin_url IS 'LinkedIn profile/company URL scraped from the website';
COMMENT ON COLUMN workflow_results.tiktok_url IS 'TikTok profile URL scraped from the website';
COMMENT ON COLUMN workflow_results.other_social_links IS 'JSONB object containing other social media links (YouTube, Pinterest, etc.)';

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_workflow_results_updated_at ON workflow_results;
CREATE TRIGGER update_workflow_results_updated_at
  BEFORE UPDATE ON workflow_results
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_results_updated_at();

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE workflow_results ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policy to allow anonymous inserts (for workflow submissions)
-- This allows workflow results to be saved using the anon key
CREATE POLICY "Allow anonymous inserts" ON workflow_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 9: Create policy to allow service role and authenticated users to read results
CREATE POLICY "Allow authenticated reads" ON workflow_results
  FOR SELECT
  TO authenticated, service_role
  USING (true);

-- Step 10: Create policy to allow authenticated users to update results
CREATE POLICY "Allow authenticated updates" ON workflow_results
  FOR UPDATE
  TO authenticated, service_role
  USING (true);

-- Alternative: If you want to disable RLS completely (less secure but simpler)
-- Uncomment the line below and comment out the RLS policies above:
-- ALTER TABLE workflow_results DISABLE ROW LEVEL SECURITY;

