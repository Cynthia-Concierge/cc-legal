-- ============================================
-- Add Legal Entity Fields to Business Profiles
-- ============================================
-- These fields are critical for auto-filling legal documents

-- Add the legal entity fields
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS legal_entity_name TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN business_profiles.legal_entity_name IS 'Official registered business name (e.g., "Zen Yoga LLC")';
COMMENT ON COLUMN business_profiles.entity_type IS 'Business entity type: LLC, Corporation, Sole Proprietorship, Partnership';
COMMENT ON COLUMN business_profiles.state IS 'State of formation/operation';
COMMENT ON COLUMN business_profiles.business_address IS 'Physical business address for legal notices';
COMMENT ON COLUMN business_profiles.owner_name IS 'Legal name of owner/representative who signs documents';
COMMENT ON COLUMN business_profiles.phone IS 'Business phone number';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 6 legal entity fields to business_profiles table';
END $$;
