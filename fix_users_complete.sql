-- Complete fix for users table
-- This ensures both the trigger AND frontend can work

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Service role can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role can update all users" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Step 2: Create comprehensive policies

-- Allow service_role full access (for backend and triggers)
CREATE POLICY "service_role_all" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own record
CREATE POLICY "authenticated_insert" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own record
CREATE POLICY "authenticated_select" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own record
CREATE POLICY "authenticated_update" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Grant permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Step 4: Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if NOT a temp password
  IF COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false) = false THEN

    -- Use INSERT ... ON CONFLICT to avoid errors
    INSERT INTO public.users (
      user_id,
      email,
      name,
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
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();

  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Done
SELECT 'Users table RLS and trigger fixed successfully!' as status;