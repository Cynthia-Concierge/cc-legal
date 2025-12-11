-- ============================================
-- Add Missing Fields to Business Profiles Table
-- ============================================
-- This migration adds all the Phase 7 fields and onboarding answer fields
-- to ensure complete data sync with GoHighLevel

-- Add the missing columns
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS hosts_retreats BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_online_courses BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_w2_employees BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sells_products BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS services TEXT[], -- Array of services
  ADD COLUMN IF NOT EXISTS has_physical_movement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS collects_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hires_staff BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_offsite_or_international BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN business_profiles.hosts_retreats IS 'Does the business host retreats or travel events?';
COMMENT ON COLUMN business_profiles.offers_online_courses IS 'Does the business sell online courses or digital memberships?';
COMMENT ON COLUMN business_profiles.has_w2_employees IS 'Does the business hire W-2 employees (not contractors)?';
COMMENT ON COLUMN business_profiles.sells_products IS 'Does the business sell physical products?';
COMMENT ON COLUMN business_profiles.services IS 'Array of services offered (from onboarding)';
COMMENT ON COLUMN business_profiles.has_physical_movement IS 'Do clients participate in physical movement?';
COMMENT ON COLUMN business_profiles.collects_online IS 'Collects payments/bookings online?';
COMMENT ON COLUMN business_profiles.hires_staff IS 'Hires staff or contractors?';
COMMENT ON COLUMN business_profiles.is_offsite_or_international IS 'Runs events off-site or internationally?';

-- Create index on boolean fields for better query performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_hosts_retreats ON business_profiles(hosts_retreats) WHERE hosts_retreats = true;
CREATE INDEX IF NOT EXISTS idx_business_profiles_offers_courses ON business_profiles(offers_online_courses) WHERE offers_online_courses = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 9 new fields to business_profiles table';
END $$;
