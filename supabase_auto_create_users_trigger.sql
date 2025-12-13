-- Automatic Users Table Population Trigger
-- This trigger ensures all authenticated users are automatically added to the users table
-- when they set a real password (not a temp password)

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if user has a real password (temp_password is false or not set)
  -- This prevents adding users during the initial email-only signup
  IF (NEW.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true THEN

    -- Insert or update the users table
    INSERT INTO public.users (
      user_id,
      email,
      name,
      password_created_at,
      onboarding_completed,
      profile_completed,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      CASE
        WHEN TG_OP = 'INSERT' THEN NOW()
        ELSE COALESCE(
          (SELECT password_created_at FROM public.users WHERE user_id = NEW.id),
          NOW()
        )
      END,
      false,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      updated_at = NOW();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Step 5: Backfill existing authenticated users who are missing from users table
-- This will add any users who were authenticated before this trigger was created
INSERT INTO public.users (
  user_id,
  email,
  name,
  password_created_at,
  onboarding_completed,
  profile_completed,
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
  au.created_at, -- Use auth creation time as password_created_at for existing users
  false,
  false,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Verify the fix
-- This query should return 0 rows if all authenticated users are now in the users table
SELECT
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'temp_password' as is_temp_password,
  'MISSING FROM USERS TABLE' as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Auto-create users trigger installed successfully!';
  RAISE NOTICE 'All existing authenticated users have been backfilled to the users table.';
  RAISE NOTICE 'New users will be automatically added when they set their password.';
END $$;
