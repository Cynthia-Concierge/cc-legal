
-- ==============================================================================
-- COMPREHENSIVE FIX FOR USERS, CONTACTS, and AUTH
-- ==============================================================================
-- This script fixes:
-- 1. public.users table (schema + RLS + trigger)
-- 2. public.contacts table (linking + RLS)
-- 3. public.business_profiles (RLS)
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. USERS TABLE FIX
-- ==============================================================================

-- Ensure table exists with correct columns
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  password_created_at TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'free'
);

-- Idempotent column checks (in case table existed but was missing columns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_completed') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_completed') THEN
        ALTER TABLE public.users ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_id') THEN
        ALTER TABLE public.users ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Reset Users Policies
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Service role all" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;
DROP POLICY IF EXISTS "authenticated_insert" ON public.users;
DROP POLICY IF EXISTS "authenticated_select" ON public.users;
DROP POLICY IF EXISTS "authenticated_update" ON public.users;

CREATE POLICY "Users can view own record" ON public.users FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Fix Auth Trigger (The root cause of "Database error saving new user")
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only insert if NOT a temp password (meaning a real user password set)
  IF COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false) = false THEN
    INSERT INTO public.users (user_id, email, name, created_at, updated_at, onboarding_completed, profile_completed)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NOW(),
      NOW(),
      false,
      false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(users.name, EXCLUDED.name),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();


-- ==============================================================================
-- 2. CONTACTS TABLE FIX
-- ==============================================================================

-- Ensure triggers for linking contacts exist
CREATE OR REPLACE FUNCTION public.link_contact_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Link contact by email
  UPDATE public.contacts
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_contact ON auth.users;
CREATE TRIGGER on_auth_user_created_link_contact
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_user_create();

-- Manual Link Function (in case trigger missed)
CREATE OR REPLACE FUNCTION public.link_contact_on_contact_create()
RETURNS TRIGGER AS $$
DECLARE
  found_user_id UUID;
BEGIN
  SELECT id INTO found_user_id FROM auth.users WHERE email = NEW.email;
  IF found_user_id IS NOT NULL THEN
    UPDATE public.contacts SET user_id = found_user_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contact_created_link_user ON public.contacts;
CREATE TRIGGER on_contact_created_link_user
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_contact_create();


-- ==============================================================================
-- 3. BUSINESS PROFILES FIX
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  website_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can insert own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can update own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Service role all business profile" ON business_profiles;

CREATE POLICY "Users can view own business profile" ON business_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business profile" ON business_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business profile" ON business_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role all business profile" ON business_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.business_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;

COMMIT;
