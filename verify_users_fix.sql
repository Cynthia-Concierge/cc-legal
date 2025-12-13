-- Verification Script: Check Users Table Fix
-- Run this in Supabase SQL Editor to verify the fix is working

-- ========================================
-- 1. Count auth users vs users table
-- ========================================
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE (raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true) as auth_users_with_real_passwords,
  (SELECT COUNT(*) FROM users) as users_in_users_table,
  (SELECT COUNT(*) FROM auth.users WHERE (raw_user_meta_data->>'temp_password')::boolean = true) as users_with_temp_passwords;

-- ========================================
-- 2. Find any missing users (should be 0)
-- ========================================
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'temp_password' as is_temp_password,
  'MISSING FROM USERS TABLE!' as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true
ORDER BY au.created_at DESC;

-- ========================================
-- 3. Verify trigger exists
-- ========================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ========================================
-- 4. Verify function exists
-- ========================================
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'handle_auth_user_created'
  AND routine_schema = 'public';

-- ========================================
-- 5. Show recent users (verify they're in both tables)
-- ========================================
SELECT
  au.email,
  au.created_at as auth_created,
  u.created_at as users_table_created,
  u.password_created_at,
  u.onboarding_completed,
  CASE
    WHEN u.user_id IS NULL THEN '❌ MISSING'
    ELSE '✅ PRESENT'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.user_id
WHERE (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true
ORDER BY au.created_at DESC
LIMIT 20;

-- ========================================
-- 6. Summary Report
-- ========================================
DO $$
DECLARE
  auth_count INTEGER;
  users_count INTEGER;
  missing_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE (raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true;
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO missing_count FROM auth.users au LEFT JOIN users u ON au.id = u.user_id WHERE u.user_id IS NULL AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true;

  -- Check trigger exists
  SELECT EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') INTO trigger_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'USERS TABLE FIX - VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Auth users (with real passwords): %', auth_count;
  RAISE NOTICE 'Users in users table: %', users_count;
  RAISE NOTICE 'Missing users: %', missing_count;
  RAISE NOTICE 'Trigger installed: %', CASE WHEN trigger_exists THEN 'YES ✅' ELSE 'NO ❌' END;
  RAISE NOTICE '========================================';

  IF missing_count > 0 THEN
    RAISE WARNING 'Found % users missing from users table! Check query results above.', missing_count;
  ELSE
    RAISE NOTICE 'All authenticated users are in the users table! ✅';
  END IF;

  IF NOT trigger_exists THEN
    RAISE WARNING 'Trigger not found! Run supabase_auto_create_users_trigger.sql';
  ELSE
    RAISE NOTICE 'Auto-create trigger is active! ✅';
  END IF;

END $$;
