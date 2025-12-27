-- ============================================
-- Fix Admin RLS Policies for God Mode
-- ============================================
-- This ensures admins can view all users and business profiles
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure is_admin function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all business profiles" ON business_profiles;

-- Step 3: Create admin policy for users table (SELECT)
-- This allows admins to view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Step 4: Create admin policy for users table (UPDATE)
-- This allows admins to update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Step 5: Create admin policy for business_profiles table (SELECT)
-- This allows admins to view all business profiles (needed for the join query)
CREATE POLICY "Admins can view all business profiles" ON business_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Step 5b: Create admin policy for contacts table (SELECT)
-- This allows admins to view all contacts
DROP POLICY IF EXISTS "Admins can view all contacts" ON contacts;
CREATE POLICY "Admins can view all contacts" ON contacts
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Step 6: (OPTIONAL) Add foreign key relationship for PostgREST nested queries
-- NOTE: The code has been updated to fetch users and profiles separately,
-- so this FK is not strictly necessary. However, if you want to use nested
-- queries in the future, you can uncomment this section.
-- 
-- This would allow PostgREST to understand the relationship between users and business_profiles
-- WARNING: This assumes every business_profile has a corresponding users record
-- If business_profiles can exist without users records, don't run this.

/*
-- Check if foreign key already exists
DO $$ 
BEGIN
    -- Check if FK to users.user_id already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'business_profiles_user_id_users_fkey' 
        AND conrelid = 'business_profiles'::regclass
    ) THEN
        -- Add foreign key from business_profiles.user_id to users.user_id
        -- This creates the relationship PostgREST needs for nested queries
        ALTER TABLE business_profiles
        ADD CONSTRAINT business_profiles_user_id_users_fkey 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
END $$;
*/

-- Step 7: Verify the policies are created
-- You can run this query to check:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('users', 'business_profiles') 
-- AND policyname LIKE '%admin%';
