-- ============================================
-- Business Profiles Table (Optional)
-- ============================================
-- This table stores wellness business profile data from the Business Profile page
-- This is OPTIONAL - the app works fine with just localStorage
-- Only create this if you want to store profile data in Supabase

-- Step 1: Create the business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  website_url TEXT,
  instagram TEXT,
  business_type TEXT,
  team_size TEXT,
  monthly_clients TEXT,
  uses_photos BOOLEAN DEFAULT false,
  primary_concern TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_created_at ON business_profiles(created_at DESC);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy to allow users to read/write their own profile
CREATE POLICY "Users can view own profile" ON business_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON business_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON business_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-update updated_at
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profiles_updated_at();

-- Step 7: Add table comment
COMMENT ON TABLE business_profiles IS 'Stores wellness business profile data from Business Profile page - optional table for Supabase storage';
