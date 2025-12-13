-- ============================================
-- Migration: Backfill Users Table
-- ============================================
-- This migration adds existing authenticated users (with passwords) to the users table
-- Run this AFTER creating the users table with supabase_users_table.sql

-- Step 1: Insert all users from auth.users who have passwords (encrypted_password IS NOT NULL)
-- This will only insert users who don't already exist in the users table
INSERT INTO users (user_id, email, name, password_created_at, created_at, updated_at)
SELECT 
  au.id as user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
  COALESCE(au.created_at, now()) as password_created_at,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.encrypted_password IS NOT NULL  -- Only users with passwords
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.user_id = au.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Update onboarding_completed status from auth.users metadata
UPDATE users u
SET onboarding_completed = COALESCE(
  (SELECT (raw_user_meta_data->>'onboarding_complete')::boolean 
   FROM auth.users 
   WHERE id = u.user_id),
  false
)
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Step 3: Update profile_completed status from business_profiles table
UPDATE users u
SET profile_completed = true
WHERE EXISTS (
  SELECT 1 FROM business_profiles bp 
  WHERE bp.user_id = u.user_id
);

-- Step 4: Show summary of what was added
SELECT 
  COUNT(*) as total_users_in_table,
  COUNT(*) FILTER (WHERE subscription_status = 'free') as free_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarding_completed,
  COUNT(*) FILTER (WHERE profile_completed = true) as profile_completed
FROM users;

