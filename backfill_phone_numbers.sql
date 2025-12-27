-- ==============================================================================
-- Backfill Phone Numbers from Contacts to Users
-- ==============================================================================
-- This script performs a one-time sync of phone numbers from contacts to users
-- for all existing records where:
-- - User exists (has a users record)
-- - Contact has a phone number
-- - User is missing a phone number
--
-- SAFETY: This is a simple UPDATE query that only fills in missing data.
-- It will NOT overwrite existing phone numbers in the users table.

BEGIN;

-- ==============================================================================
-- Step 1: Show what will be updated (for review)
-- ==============================================================================
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Count how many records will be updated
  SELECT COUNT(*)
  INTO update_count
  FROM public.users u
  INNER JOIN public.contacts c ON c.user_id = u.user_id
  WHERE c.phone IS NOT NULL
    AND c.phone != ''
    AND (u.phone IS NULL OR u.phone = '');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phone Number Backfill Preview';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Records to update: %', update_count;
  RAISE NOTICE '';

  IF update_count = 0 THEN
    RAISE NOTICE '✓ No records need updating - all phones already synced!';
  ELSE
    RAISE NOTICE 'Will copy phone from contacts -> users for % user(s)', update_count;
  END IF;
  RAISE NOTICE '';
END $$;

-- ==============================================================================
-- Step 2: Show sample of records that will be updated
-- ==============================================================================
SELECT
  u.email,
  c.phone AS contact_phone,
  u.phone AS user_phone,
  'Will update' AS action
FROM public.users u
INNER JOIN public.contacts c ON c.user_id = u.user_id
WHERE c.phone IS NOT NULL
  AND c.phone != ''
  AND (u.phone IS NULL OR u.phone = '')
LIMIT 10;

-- ==============================================================================
-- Step 3: Perform the backfill
-- ==============================================================================
UPDATE public.users u
SET
  phone = c.phone,
  updated_at = NOW()
FROM public.contacts c
WHERE c.user_id = u.user_id
  AND c.phone IS NOT NULL
  AND c.phone != ''
  AND (u.phone IS NULL OR u.phone = '');

-- ==============================================================================
-- Step 4: Show results
-- ==============================================================================
DO $$
DECLARE
  total_users INTEGER;
  users_with_phone INTEGER;
  contacts_with_phone INTEGER;
  synced_count INTEGER;
BEGIN
  -- Get statistics
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO users_with_phone FROM public.users WHERE phone IS NOT NULL AND phone != '';
  SELECT COUNT(*) INTO contacts_with_phone FROM public.contacts WHERE phone IS NOT NULL AND phone != '';

  -- Count how many are now synced
  SELECT COUNT(*)
  INTO synced_count
  FROM public.users u
  INNER JOIN public.contacts c ON c.user_id = u.user_id
  WHERE c.phone IS NOT NULL
    AND c.phone != ''
    AND u.phone IS NOT NULL
    AND u.phone != ''
    AND u.phone = c.phone;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Backfill Results';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with phone: %', users_with_phone;
  RAISE NOTICE 'Contacts with phone: %', contacts_with_phone;
  RAISE NOTICE 'Synced contact-user pairs: %', synced_count;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Backfill complete!';
  RAISE NOTICE '';
END $$;

-- ==============================================================================
-- Step 5: Verification - Find any remaining mismatches
-- ==============================================================================
-- This shows contacts with phones that don't match their user record
-- (Should only show records where contact has phone but user account doesn't exist yet)
SELECT
  c.email,
  c.phone AS contact_phone,
  u.phone AS user_phone,
  CASE
    WHEN u.user_id IS NULL THEN 'No user account yet'
    WHEN u.phone IS NULL OR u.phone = '' THEN 'User missing phone'
    WHEN c.phone != u.phone THEN 'Phone mismatch'
    ELSE 'Synced'
  END AS status
FROM public.contacts c
LEFT JOIN public.users u ON c.user_id = u.user_id
WHERE c.phone IS NOT NULL AND c.phone != ''
ORDER BY status, c.email
LIMIT 20;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Review the verification results above';
  RAISE NOTICE '2. Going forward, phones will sync automatically via triggers';
  RAISE NOTICE '3. Test by creating a new contact or updating a phone number';
  RAISE NOTICE '';
END $$;
