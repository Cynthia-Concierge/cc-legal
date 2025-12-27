-- ============================================
-- Migration: Add Calendly Booking Tracking to Contacts
-- ============================================
-- This migration adds tracking for when users book a call via Calendly during onboarding
-- Run this in Supabase SQL Editor

-- Step 1: Add calendly_booked_at column (timestamp - NULL if not booked, has value if booked)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS calendly_booked_at TIMESTAMPTZ;

-- Step 2: Add index for faster queries (e.g., "show me all contacts who booked a call")
CREATE INDEX IF NOT EXISTS idx_contacts_calendly_booked_at ON contacts(calendly_booked_at) 
WHERE calendly_booked_at IS NOT NULL;

-- Step 3: Add table comment
COMMENT ON COLUMN contacts.calendly_booked_at IS 'Timestamp when user booked a call via Calendly during onboarding. NULL if not booked.';

-- Step 4: Update RLS policy if needed (should already allow updates via existing policy)
-- The existing "Users can update own contact" policy should cover this
