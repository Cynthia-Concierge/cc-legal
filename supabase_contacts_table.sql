-- ============================================
-- Contacts Table Setup for Form Submissions
-- ============================================
-- This table stores contact information from the "Enter Your Info" form
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Step 3: Add table comment
COMMENT ON TABLE contacts IS 'Form submissions from landing page - stores contact information from opt-ins';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy to allow anonymous inserts (for form submissions)
-- This allows form submissions using the anon key
CREATE POLICY "Allow anonymous inserts" ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 6: Create policy to allow service role and authenticated users to read contacts
-- Adjust this based on your needs - you might want to restrict this further
CREATE POLICY "Allow authenticated reads" ON contacts
  FOR SELECT
  TO authenticated, service_role
  USING (true);

-- Alternative: If you want to disable RLS completely (less secure but simpler)
-- Uncomment the line below and comment out the RLS policies above:
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

