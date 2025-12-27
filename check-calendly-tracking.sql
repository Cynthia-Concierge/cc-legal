-- ============================================
-- Diagnostic Query: Check Calendly Booking Tracking
-- ============================================
-- Run this in Supabase SQL Editor to verify the tracking system

-- Step 1: Check if columns exist in both tables
SELECT
    'contacts' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'calendly_booked_at'

UNION ALL

SELECT
    'users' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'calendly_booked_at';

-- Step 2: Check recent contacts (last 5, to see if calendly_booked_at exists and has data)
SELECT
    email,
    name,
    created_at,
    calendly_booked_at,
    CASE
        WHEN calendly_booked_at IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_booked_call
FROM contacts
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Count contacts who have booked vs not booked
SELECT
    COUNT(*) FILTER (WHERE calendly_booked_at IS NOT NULL) as contacts_booked,
    COUNT(*) FILTER (WHERE calendly_booked_at IS NULL) as contacts_not_booked,
    COUNT(*) as total_contacts
FROM contacts;

-- Step 4: Check recent users (last 5, to see if calendly_booked_at exists and has data)
SELECT
    email,
    name,
    created_at,
    calendly_booked_at,
    CASE
        WHEN calendly_booked_at IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_booked_call
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Step 5: Count users who have booked vs not booked
SELECT
    COUNT(*) FILTER (WHERE calendly_booked_at IS NOT NULL) as users_booked,
    COUNT(*) FILTER (WHERE calendly_booked_at IS NULL) as users_not_booked,
    COUNT(*) as total_users
FROM users;

-- Step 6: Find contacts/users created today (to see if your recent booking shows up)
SELECT
    'contact' as record_type,
    email,
    name,
    created_at,
    calendly_booked_at
FROM contacts
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT
    'user' as record_type,
    email,
    name,
    created_at,
    calendly_booked_at
FROM users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
