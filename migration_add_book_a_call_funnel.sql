-- ============================================
-- Migration: Create book_a_call_funnel table
-- ============================================
-- This table tracks leads from the /book page funnel
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the book_a_call_funnel table
CREATE TABLE IF NOT EXISTS book_a_call_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Form submission tracking
  form_submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta_lead_event_id TEXT, -- Event ID from Meta Pixel Lead event
  
  -- Calendly booking tracking
  calendly_scheduled_at TIMESTAMPTZ,
  calendly_event_uri TEXT, -- Calendly event URI if available
  meta_schedule_event_id TEXT, -- Event ID from Meta Pixel Schedule event
  
  -- Status tracking
  status TEXT DEFAULT 'form_submitted', -- 'form_submitted', 'call_scheduled', 'call_completed'
  
  -- Additional tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_a_call_funnel_email ON book_a_call_funnel(email);
CREATE INDEX IF NOT EXISTS idx_book_a_call_funnel_form_submitted_at ON book_a_call_funnel(form_submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_a_call_funnel_status ON book_a_call_funnel(status);
CREATE INDEX IF NOT EXISTS idx_book_a_call_funnel_calendly_scheduled_at ON book_a_call_funnel(calendly_scheduled_at DESC);

-- Step 3: Add table comment
COMMENT ON TABLE book_a_call_funnel IS 'Tracks leads from the /book page funnel - form submissions and Calendly bookings';

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE book_a_call_funnel ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy to allow anonymous inserts (for form submissions)
CREATE POLICY "Allow anonymous inserts" ON book_a_call_funnel
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Step 6: Create policy to allow service role to read all records
CREATE POLICY "Allow service role reads" ON book_a_call_funnel
  FOR SELECT
  TO service_role
  USING (true);

-- Step 7: Create policy to allow service role to update records
CREATE POLICY "Allow service role updates" ON book_a_call_funnel
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 8: Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_book_a_call_funnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_book_a_call_funnel_updated_at ON book_a_call_funnel;
CREATE TRIGGER update_book_a_call_funnel_updated_at
  BEFORE UPDATE ON book_a_call_funnel
  FOR EACH ROW
  EXECUTE FUNCTION update_book_a_call_funnel_updated_at();

