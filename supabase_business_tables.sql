-- Create the businesses table for storing business information
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the business_configs table for storing JSON configuration per business
CREATE TABLE IF NOT EXISTS business_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  raw_scrape JSONB, -- Raw Firecrawl output
  normalized_scrape JSONB, -- Normalized website data
  structured_data JSONB, -- Fully structured business data
  services JSONB, -- Array of services/treatments
  pricing JSONB, -- Pricing information
  faq JSONB, -- FAQ data
  images JSONB, -- Logo, hero images, etc.
  navigation JSONB, -- Navigation structure
  booking_rules JSONB, -- Booking configuration and rules
  face_analysis_profile JSONB, -- Face analysis configuration (future)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_configs_business_id ON business_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_business_configs_updated_at ON business_configs(updated_at DESC);

-- Add comments to tables
COMMENT ON TABLE businesses IS 'Core business information';
COMMENT ON TABLE business_configs IS 'Business-specific JSON configuration for AI widget';

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_updated_at();

CREATE TRIGGER update_business_configs_updated_at
  BEFORE UPDATE ON business_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_business_updated_at();

