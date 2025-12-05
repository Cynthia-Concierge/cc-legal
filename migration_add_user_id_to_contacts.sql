-- ============================================
-- Migration: Add user_id to contacts table
-- ============================================
-- This migration adds user_id field to link contacts to users
-- Run this in Supabase SQL Editor if you already have a contacts table

-- Step 1: Add user_id column (nullable, will be set when user creates password)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Add updated_at column if it doesn't exist
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Step 3: Create index for user_id
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Step 4: Update RLS policy to allow users to read their own contact
DROP POLICY IF EXISTS "Allow authenticated reads" ON contacts;
CREATE POLICY "Allow authenticated reads" ON contacts
  FOR SELECT
  TO authenticated, service_role
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Step 5: Add policy for users to update their own contact
DROP POLICY IF EXISTS "Users can update own contact" ON contacts;
CREATE POLICY "Users can update own contact" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Create function to auto-update updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();
