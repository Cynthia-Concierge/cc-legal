-- ============================================
-- FIX AUTH TRIGGERS THAT ARE BLOCKING UPDATES
-- ============================================

BEGIN;

-- Drop the trigger temporarily so we can update users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add error handling to prevent 500 errors
  BEGIN
    -- Only proceed if this is NOT a temp password
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

      -- Link contact to user
      UPDATE public.contacts
      SET user_id = NEW.id,
          updated_at = NOW()
      WHERE email = NEW.email
        AND user_id IS NULL;

    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block the auth operation
    RAISE WARNING 'handle_auth_user_created failed: %', SQLERRM;
    -- Return NEW anyway to allow the auth operation to proceed
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

COMMIT;

SELECT '✅ Trigger fixed - auth updates should work now' as status;
