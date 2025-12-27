-- ============================================
-- Migration: Add Calendly Booking Tracking to Users Table
-- ============================================
-- This migration adds tracking for when users book a call via Calendly
-- Run this in Supabase SQL Editor

-- Step 1: Add calendly_booked_at column (timestamp - NULL if not booked, has value if booked)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS calendly_booked_at TIMESTAMPTZ;

-- Step 2: Add index for faster queries (e.g., "show me all users who booked a call")
CREATE INDEX IF NOT EXISTS idx_users_calendly_booked_at ON users(calendly_booked_at) 
WHERE calendly_booked_at IS NOT NULL;

-- Step 3: Add table comment
COMMENT ON COLUMN users.calendly_booked_at IS 'Timestamp when user booked a call via Calendly. NULL if not booked.';
