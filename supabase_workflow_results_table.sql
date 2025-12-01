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
CREATE INDEX IF NOT EXISTS idx_workflow_results_created_at ON workflow_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_results_status ON workflow_results(status);

-- Step 3: Create GIN indexes for JSONB columns (for efficient JSON queries)
CREATE INDEX IF NOT EXISTS idx_workflow_results_legal_documents ON workflow_results USING GIN (legal_documents);
CREATE INDEX IF NOT EXISTS idx_workflow_results_analysis ON workflow_results USING GIN (analysis);

-- Step 4: Add table comment
COMMENT ON TABLE workflow_results IS 'Stores results from Legal Analyzer workflow - website scraping, legal analysis, and generated emails';

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update updated_at
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

