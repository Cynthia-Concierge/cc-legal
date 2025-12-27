-- ==============================================================================
-- Phone Number Syncing Between Contacts and Users Tables
-- ==============================================================================
-- This migration creates triggers to automatically sync phone numbers between
-- contacts and users tables to ensure consistent phone data across the journey.
--
-- SAFETY: Uses same patterns as existing triggers (SECURITY DEFINER, simple logic)
-- - Will NOT block existing operations
-- - Will NOT overwrite data unnecessarily
-- - Prevents circular updates by checking if value changed
--
-- What this does:
-- 1. When user account is created, copy phone from contacts -> users
-- 2. When phone updated in users table, sync to contacts
-- 3. When phone updated in contacts table, sync to users (if user exists)
-- 4. Keep business_profiles.phone independent (it's for legal documents)

BEGIN;

-- ==============================================================================
-- FUNCTION 1: Sync phone from contacts -> users when user record is created
-- ==============================================================================
-- This fires when a new row is inserted into the users table
-- It finds the matching contact and copies the phone number
CREATE OR REPLACE FUNCTION public.sync_phone_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy phone from contacts to the newly created user record
  -- Only if contacts has a phone and user doesn't
  UPDATE public.users
  SET phone = c.phone
  FROM public.contacts c
  WHERE users.user_id = NEW.user_id
    AND c.user_id = NEW.user_id
    AND c.phone IS NOT NULL
    AND c.phone != ''
    AND (NEW.phone IS NULL OR NEW.phone = '');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and create trigger
DROP TRIGGER IF EXISTS on_user_created_sync_phone ON public.users;
CREATE TRIGGER on_user_created_sync_phone
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_phone_on_user_create();

-- ==============================================================================
-- FUNCTION 2: Sync phone updates from users -> contacts
-- ==============================================================================
-- This fires when phone is updated in the users table
-- It syncs the change to the linked contact record
CREATE OR REPLACE FUNCTION public.sync_phone_user_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if phone actually changed and is not null
  IF (OLD.phone IS DISTINCT FROM NEW.phone) AND NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Update the linked contact's phone
    UPDATE public.contacts
    SET phone = NEW.phone
    WHERE user_id = NEW.user_id
      AND (phone IS NULL OR phone = '' OR phone != NEW.phone); -- Only update if different
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and create trigger
DROP TRIGGER IF EXISTS on_user_phone_updated_sync_contact ON public.users;
CREATE TRIGGER on_user_phone_updated_sync_contact
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_phone_user_to_contact();

-- ==============================================================================
-- FUNCTION 3: Sync phone updates from contacts -> users
-- ==============================================================================
-- This fires when phone is updated in the contacts table
-- It syncs the change to the linked user record (if it exists)
CREATE OR REPLACE FUNCTION public.sync_phone_contact_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if:
  -- 1. Phone actually changed
  -- 2. Contact is linked to a user (user_id is not null)
  -- 3. New phone value is not null/empty
  IF (OLD.phone IS DISTINCT FROM NEW.phone)
     AND NEW.user_id IS NOT NULL
     AND NEW.phone IS NOT NULL
     AND NEW.phone != '' THEN

    -- Update the linked user's phone
    UPDATE public.users
    SET phone = NEW.phone
    WHERE user_id = NEW.user_id
      AND (phone IS NULL OR phone = '' OR phone != NEW.phone); -- Only update if different
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and create trigger
DROP TRIGGER IF EXISTS on_contact_phone_updated_sync_user ON public.contacts;
CREATE TRIGGER on_contact_phone_updated_sync_user
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_phone_contact_to_user();

COMMIT;

-- ==============================================================================
-- Verification Queries
-- ==============================================================================
-- Run these to verify triggers are installed:

-- 1. Check triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_user_created_sync_phone',
  'on_user_phone_updated_sync_contact',
  'on_contact_phone_updated_sync_user'
)
ORDER BY event_object_table, trigger_name;

-- 2. Check functions exist
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name IN (
  'sync_phone_on_user_create',
  'sync_phone_user_to_contact',
  'sync_phone_contact_to_user'
)
ORDER BY routine_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Phone sync triggers installed successfully!';
  RAISE NOTICE '✓ Phones will now sync automatically between contacts and users';
  RAISE NOTICE '✓ business_profiles.phone remains independent for legal documents';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run backfill_phone_numbers.sql to sync existing data';
END $$;
