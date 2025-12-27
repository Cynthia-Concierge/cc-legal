-- ==============================================================================
-- Fix Contact Linking (Automatic)
-- ==============================================================================
-- This script sets up database triggers to automatically link 'contacts' to 'users'
-- whenever a signup happens. This bypasses RLS issues where the frontend might
-- not have permission to search/update the contact by email.

BEGIN;

-- 1. Function to link contact to user on User Creation (when they set password/signup in auth.users)
CREATE OR REPLACE FUNCTION public.link_contact_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Find any contact with this email and set the user_id
  UPDATE public.contacts
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL; -- Only if not already linked
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Run as superuser to bypass RLS

-- 2. Trigger on auth.users
-- This fires when a new user is created in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created_link_contact ON auth.users;
CREATE TRIGGER on_auth_user_created_link_contact
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_user_create();

-- 3. Function to link contact to user on Contact Creation
-- (In case the User account exists BEFORE the contact form is submitted)
CREATE OR REPLACE FUNCTION public.link_contact_on_contact_create()
RETURNS TRIGGER AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Check if a user exists with this email
  SELECT id INTO found_user_id FROM auth.users WHERE email = NEW.email;
  
  IF found_user_id IS NOT NULL THEN
    UPDATE public.contacts
    SET user_id = found_user_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger on contacts
DROP TRIGGER IF EXISTS on_contact_created_link_user ON public.contacts;
CREATE TRIGGER on_contact_created_link_user
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_contact_create();

-- 5. Backfill: Link any existing orphaned contacts
UPDATE public.contacts c
SET user_id = u.id
FROM auth.users u
WHERE c.email = u.email
AND c.user_id IS NULL;

COMMIT;
