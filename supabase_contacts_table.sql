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
  source TEXT DEFAULT 'wellness', -- 'wellness', 'gym', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
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
-- Users can read their own contact record, service role can read all
CREATE POLICY "Allow authenticated reads" ON contacts
  FOR SELECT
  TO authenticated, service_role
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Step 7: Create policy to allow users to update their own contact record
CREATE POLICY "Users can update own contact" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-update updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Alternative: If you want to disable RLS completely (less secure but simpler)
-- Uncomment the line below and comment out the RLS policies above:
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

