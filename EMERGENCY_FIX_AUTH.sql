-- ============================================
-- EMERGENCY FIX: Authentication & User Creation
-- ============================================
-- This fixes:
-- 1. Existing users unable to log in (database errors)
-- 2. New users unable to create passwords
-- 3. Users table and contacts table issues

BEGIN;

-- ============================================
-- STEP 1: Drop ALL existing conflicting policies and triggers
-- ============================================
-- Drop all users table policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Service role can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role can update all users" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "service_role_all" ON users;
DROP POLICY IF EXISTS "authenticated_insert" ON users;
DROP POLICY IF EXISTS "authenticated_select" ON users;
DROP POLICY IF EXISTS "authenticated_update" ON users;

-- Drop all contacts table policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated reads" ON contacts;
DROP POLICY IF EXISTS "Allow service role full access" ON contacts;
DROP POLICY IF EXISTS "Users can update own contact" ON contacts;

-- Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_link_contact ON auth.users;
DROP TRIGGER IF EXISTS sync_email_to_users ON auth.users;

-- Drop all triggers on contacts
DROP TRIGGER IF EXISTS on_contact_created_link_user ON contacts;

-- ============================================
-- STEP 2: Fix Users Table Structure & Policies
-- ============================================

-- Ensure users table exists with correct schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_tier TEXT DEFAULT 'free',
  password_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions (CRITICAL - must be done before policies)
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create NEW policies (order matters!)

-- 1. Service role has FULL ACCESS (highest priority)
CREATE POLICY "service_role_full_access_users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Authenticated users can INSERT their own record
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can SELECT their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Authenticated users can UPDATE their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 3: Fix Contacts Table & Policies
-- ============================================

-- Ensure contacts table exists
CREATE TABLE IF NOT EXISTS contacts (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.contacts TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.contacts TO authenticated, anon;

-- Create policies

-- 1. Service role has FULL ACCESS
CREATE POLICY "service_role_full_access_contacts" ON contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Allow anonymous and authenticated to INSERT (for form submissions)
CREATE POLICY "contacts_allow_insert" ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Authenticated users can SELECT their own contact
CREATE POLICY "contacts_select_own" ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 4. Authenticated users can UPDATE their own contact
CREATE POLICY "contacts_update_own" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 4: Create Trigger Functions (SECURITY DEFINER to bypass RLS)
-- ============================================

-- Function 1: Auto-create user in users table when auth.users record is created/updated
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER -- This is CRITICAL - allows function to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if this is NOT a temp password
  -- temp_password = false or null means real password
  IF COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false) = false THEN

    -- Insert or update users table
    INSERT INTO public.users (
      user_id,
      email,
      name,
      password_created_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
      ),
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      updated_at = NOW();

    -- Also link contact to user
    UPDATE public.contacts
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email
      AND user_id IS NULL;

  END IF;

  RETURN NEW;
END;
$$;

-- Function 2: Link contact to user when contact is created (if user already exists)
CREATE OR REPLACE FUNCTION public.link_contact_on_create()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Check if a user exists with this email
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = NEW.email;

  IF found_user_id IS NOT NULL THEN
    NEW.user_id = found_user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Function 3: Update contacts updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Update users updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create Triggers
-- ============================================

-- Trigger: Auto-create user when auth.users is created/updated
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Trigger: Link contact to user when contact is created
CREATE TRIGGER on_contact_created_link_user
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_create();

-- Trigger: Update contacts updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Trigger: Update users updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- STEP 6: Backfill existing data
-- ============================================

-- Backfill: Add all existing auth.users who don't have temp passwords to users table
INSERT INTO public.users (
  user_id,
  email,
  name,
  password_created_at,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1),
    'User'
  ),
  au.created_at,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND COALESCE((au.raw_user_meta_data->>'temp_password')::boolean, false) = false
ON CONFLICT (user_id) DO NOTHING;

-- Backfill: Link all existing contacts to their users
UPDATE public.contacts c
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE c.email = u.email
  AND c.user_id IS NULL;

COMMIT;

-- ============================================
-- Verification Queries
-- ============================================

-- Check users table
SELECT 'Users table check:' as status;
SELECT COUNT(*) as total_users FROM users;

-- Check for orphaned auth.users
SELECT 'Orphaned auth.users (should be 0):' as status;
SELECT COUNT(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND COALESCE((au.raw_user_meta_data->>'temp_password')::boolean, false) = false;

-- Check contacts
SELECT 'Contacts table check:' as status;
SELECT COUNT(*) as total_contacts FROM contacts;

-- Check linked contacts
SELECT 'Linked contacts:' as status;
SELECT COUNT(*) as linked_contacts FROM contacts WHERE user_id IS NOT NULL;

SELECT '✅ EMERGENCY FIX COMPLETE!' as status;
