# Contact to User Linking Implementation

## Overview
This document explains how contacts are linked to users when they create a password, ensuring all data persists properly in Supabase.

## Flow

1. **Initial Form Submission** → Contact created in `contacts` table
   - User fills out form on landing page
   - Contact saved with: email, name, phone, website
   - `user_id` is NULL at this point

2. **Onboarding** → User account created (optional)
   - User goes through onboarding questions
   - Supabase auth user may be created with temp password
   - Contact still not linked (user_id still NULL)

3. **Business Profile** → User creates password → Contact linked
   - User fills out business profile form
   - If user creates a password:
     - Password is set in Supabase auth
     - **Contact record is updated with user_id** (links contact to user)
     - Business profile data saved to `business_profiles` table
   - All data now persists and is linked to the user account

## Database Changes

### Contacts Table
- Added `user_id` field (UUID, nullable, references auth.users)
- Added `updated_at` timestamp
- Added index on `user_id` for faster lookups
- Updated RLS policies to allow users to read/update their own contact

### Migration
Run `migration_add_user_id_to_contacts.sql` in Supabase SQL Editor if you already have a contacts table.

## Code Changes

### BusinessProfile Component
1. **Data Loading**: Now loads from Supabase when user is logged in (falls back to localStorage)
2. **Contact Linking**: When password is created, automatically links contact record to user_id
3. **Data Persistence**: All business profile fields saved to `business_profiles` table

## Testing

To test the complete flow:

1. Fill out form on landing page → Check `contacts` table (user_id should be NULL)
2. Go through onboarding → User may be created in auth.users
3. Fill out Business Profile and create password → Check:
   - `contacts` table: user_id should now be set
   - `business_profiles` table: all fields should be saved
4. Log out and log back in → Business Profile should load from Supabase

## Benefits

- **Data Persistence**: All data saved to Supabase, not just localStorage
- **Cross-Device**: Users can access their data from any device
- **Contact Linking**: Initial form submission is linked to user account
- **Backward Compatible**: Still works with localStorage if Supabase not configured
