-- ============================================
-- Cold Leads Table Setup
-- ============================================
-- This table stores cold leads imported from Instantly or other sources
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the cold_leads table
CREATE TABLE IF NOT EXISTS cold_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  location TEXT,
  linkedin_url TEXT,
  email_1 TEXT,
  email_2 TEXT,
  company_website TEXT,
  source TEXT DEFAULT 'instantly',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  scraped_email TEXT,
  scraped_emails JSONB,
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  linkedin_url_scraped TEXT,
  tiktok_url TEXT,
  other_social_links JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cold_leads_first_name ON cold_leads(first_name);
CREATE INDEX IF NOT EXISTS idx_cold_leads_last_name ON cold_leads(last_name);
CREATE INDEX IF NOT EXISTS idx_cold_leads_company ON cold_leads(company);
CREATE INDEX IF NOT EXISTS idx_cold_leads_email_1 ON cold_leads(email_1);
CREATE INDEX IF NOT EXISTS idx_cold_leads_email_2 ON cold_leads(email_2);
CREATE INDEX IF NOT EXISTS idx_cold_leads_linkedin_url ON cold_leads(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_cold_leads_imported_at ON cold_leads(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_cold_leads_source ON cold_leads(source);
CREATE INDEX IF NOT EXISTS idx_cold_leads_analyzed_at ON cold_leads(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cold_leads_scraped_email ON cold_leads(scraped_email);
CREATE INDEX IF NOT EXISTS idx_cold_leads_instagram_url ON cold_leads(instagram_url);

-- Step 3: Add table comment
COMMENT ON TABLE cold_leads IS 'Stores cold leads imported from Instantly or other lead sources';
COMMENT ON COLUMN cold_leads.scraped_email IS 'Primary email address scraped from the website during analysis';
COMMENT ON COLUMN cold_leads.scraped_emails IS 'Array of all email addresses found on the website';
COMMENT ON COLUMN cold_leads.instagram_url IS 'Instagram profile URL scraped from the website';
COMMENT ON COLUMN cold_leads.facebook_url IS 'Facebook profile/page URL scraped from the website';
COMMENT ON COLUMN cold_leads.twitter_url IS 'Twitter/X profile URL scraped from the website';
COMMENT ON COLUMN cold_leads.linkedin_url_scraped IS 'LinkedIn profile/company URL scraped from the website (different from linkedin_url which is from lead import)';
COMMENT ON COLUMN cold_leads.tiktok_url IS 'TikTok profile URL scraped from the website';
COMMENT ON COLUMN cold_leads.other_social_links IS 'JSONB object containing other social media links (YouTube, Pinterest, etc.)';

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cold_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_cold_leads_updated_at ON cold_leads;
CREATE TRIGGER update_cold_leads_updated_at
  BEFORE UPDATE ON cold_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_cold_leads_updated_at();

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE cold_leads ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policy to allow anonymous inserts (for lead imports)
CREATE POLICY "Allow anonymous inserts" ON cold_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 8: Create policy to allow service role and authenticated users to read leads
CREATE POLICY "Allow authenticated reads" ON cold_leads
  FOR SELECT
  TO authenticated, service_role
  USING (true);

-- Step 9: Create policy to allow authenticated users to update leads
CREATE POLICY "Allow authenticated updates" ON cold_leads
  FOR UPDATE
  TO authenticated, service_role
  USING (true);

-- Step 10: Create policy to allow authenticated users to delete leads
CREATE POLICY "Allow authenticated deletes" ON cold_leads
  FOR DELETE
  TO authenticated, service_role
  USING (true);

-- Alternative: If you want to disable RLS completely (less secure but simpler)
-- Uncomment the line below and comment out the RLS policies above:
-- ALTER TABLE cold_leads DISABLE ROW LEVEL SECURITY;

