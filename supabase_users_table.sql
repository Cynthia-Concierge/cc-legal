-- ============================================
-- Users Table Setup
-- ============================================
-- This table tracks authenticated users (people who have created passwords)
-- This is separate from auth.users and tracks our application-level user data
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'free', -- 'free', 'active', 'cancelled', 'expired'
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'monthly', 'annual'
  password_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_password_created_at ON users(password_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Step 3: Add table comment
COMMENT ON TABLE users IS 'Tracks authenticated users who have created passwords - application-level user data';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy to allow users to read their own record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 6: Create policy to allow service role to read all users (for admin operations)
CREATE POLICY "Service role can read all users" ON users
  FOR SELECT
  TO service_role
  USING (true);

-- Step 7: Create policy to allow users to insert their own record
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Create policy to allow users to update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 9: Create policy to allow service role to update any user (for admin operations)
CREATE POLICY "Service role can update all users" ON users
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 10: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Step 12: Create a function to sync email from auth.users when it changes
-- This ensures the email in users table stays in sync with auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in users table when auth.users email changes
  UPDATE users
  SET email = NEW.email,
      updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create trigger on auth.users to sync email (if you want automatic syncing)
-- Note: This requires enabling the trigger on auth.users which may need special permissions
-- Uncomment if you want automatic email syncing:
-- CREATE TRIGGER sync_email_to_users
--   AFTER UPDATE OF email ON auth.users
--   FOR EACH ROW
--   WHEN (OLD.email IS DISTINCT FROM NEW.email)
--   EXECUTE FUNCTION sync_user_email();

