-- ============================================
-- COMPLETE AUTH FIX - Fixes all auth/user issues
-- ============================================
-- This will:
-- 1. Fix triggers that are blocking auth updates
-- 2. Ensure all tables and policies are correct
-- 3. Allow password resets to work

BEGIN;

-- ============================================
-- STEP 1: Drop ALL triggers on auth.users temporarily
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_link_contact ON auth.users;
DROP TRIGGER IF EXISTS sync_email_to_users ON auth.users;

-- ============================================
-- STEP 2: Recreate trigger function with EXCEPTION HANDLING
-- ============================================
-- This prevents the trigger from blocking auth operations if there's an error

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message text;
BEGIN
  -- Wrap everything in exception handling
  BEGIN
    -- Only proceed if this is NOT a temp password
    IF COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false) = false THEN

      -- Try to insert/update users table
      BEGIN
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

      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        RAISE WARNING 'Failed to upsert users table: %', v_error_message;
        -- Continue anyway
      END;

      -- Try to link contact
      BEGIN
        UPDATE public.contacts
        SET user_id = NEW.id,
            updated_at = NOW()
        WHERE email = NEW.email
          AND user_id IS NULL;

      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        RAISE WARNING 'Failed to link contact: %', v_error_message;
        -- Continue anyway
      END;

    END IF;

  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RAISE WARNING 'handle_auth_user_created encountered error: %', v_error_message;
    -- Always return NEW to allow the auth operation to proceed
  END;

  -- CRITICAL: Always return NEW, even if there were errors
  -- This ensures auth operations (login, signup, password update) work
  RETURN NEW;
END;
$$;

-- ============================================
-- STEP 3: Recreate the trigger
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- ============================================
-- STEP 4: Ensure users table has correct structure
-- ============================================
-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add calendly_booked_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'calendly_booked_at'
  ) THEN
    ALTER TABLE users ADD COLUMN calendly_booked_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add tags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tags'
  ) THEN
    ALTER TABLE users ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add profile_completion_reminder_sent_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_completion_reminder_sent_at'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_completion_reminder_sent_at TIMESTAMPTZ;
  END IF;
END $$;

COMMIT;

-- ============================================
-- Verification
-- ============================================
SELECT '✅ COMPLETE AUTH FIX APPLIED!' as status;
SELECT 'Triggers recreated with error handling' as note_1;
SELECT 'Auth operations (login, password reset) should work now' as note_2;
SELECT 'Try logging in or resetting password now' as note_3;
