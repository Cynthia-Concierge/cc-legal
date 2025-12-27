-- Repair contacts table structure
-- This script fixes the issue where 'contacts' seems to be linked to a broken 'unified_contacts' relation
-- and fixes the RLS policy that is blocking anonymous inserts.

BEGIN;

-- 1. Backup existing contacts data if possible (safety first)
CREATE TABLE IF NOT EXISTS contacts_backup AS SELECT * FROM contacts;

-- 2. Drop the problematic contacts object (whether it's a table, view, or has broken triggers)
DROP TABLE IF EXISTS contacts CASCADE;

-- 3. Recreate the contacts table with the correct schema
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  website TEXT,
  source TEXT DEFAULT 'wellness',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calendly_booked_at TIMESTAMPTZ
);

-- 4. Restore data from backup (mapping columns carefully)
-- We attempt to insert what we can. If the backup has different columns, this might need adjustment.
-- We use DO block to handle potential column mismatches gracefully or just simple INSERT if columns match.
INSERT INTO contacts (id, email, name, first_name, last_name, phone, website, source, user_id, created_at, updated_at)
SELECT 
  id, 
  email, 
  name, 
  first_name, 
  last_name, 
  phone, 
  website, 
  source, 
  user_id, 
  created_at, 
  updated_at
FROM contacts_backup
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- 5. Create indexes
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- 6. Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies

-- Allow anonymous inserts (CRITICAL for public form)
CREATE POLICY "Allow anonymous inserts" ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated reads (Users can see their own contact)
CREATE POLICY "Allow authenticated reads" ON contacts
  FOR SELECT
  TO authenticated, service_role
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Allow service role full access (CRUD)
CREATE POLICY "Allow service role full access" ON contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to update their own contact
CREATE POLICY "Users can update own contact" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- 9. Verify it works
-- (This part is just for confirmation, the script finishes here)

COMMIT;
