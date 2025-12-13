# Users Table Setup Guide

## Overview

The `users` table tracks authenticated users who have created passwords. This is separate from `auth.users` and provides application-level tracking for subscription management, onboarding status, and user analytics.

## Setup Steps

### 1. Create the Users Table

Run the SQL script in your Supabase SQL Editor:

```bash
supabase_users_table.sql
```

This will:
- Create the `users` table with all necessary fields
- Set up indexes for performance
- Configure Row Level Security (RLS) policies
- Create triggers for automatic timestamp updates

### 2. Backfill Existing Users (Optional)

If you already have users with passwords, run the migration to add them to the new table:

```bash
migration_backfill_users_table.sql
```

This will:
- Insert all existing users from `auth.users` who have passwords
- Update onboarding and profile completion status
- Show a summary of what was added

### 3. Verify the Setup

Run this query to check your users table:

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE subscription_status = 'free') as free_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarding_completed,
  COUNT(*) FILTER (WHERE profile_completed = true) as profile_completed
FROM users;
```

## How It Works

### Automatic User Creation

Users are automatically added to the `users` table when they:
1. **Create a password in Onboarding** (`Onboarding.tsx`)
2. **Create a password in Business Profile** (`BusinessProfile.tsx`)

### Automatic Status Updates

The table automatically tracks:
- **`onboarding_completed`**: Set to `true` when user completes onboarding
- **`profile_completed`**: Set to `true` when user saves business profile
- **`last_login_at`**: Can be updated on login (you'll need to add this)

## Table Schema

```sql
users (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'free',  -- 'free', 'active', 'cancelled', 'expired'
  subscription_tier TEXT DEFAULT 'free',    -- 'free', 'monthly', 'annual'
  password_created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Use Cases

### Query Users with Passwords

```sql
SELECT * FROM users WHERE password_created_at IS NOT NULL;
```

### Find Users Who Completed Onboarding

```sql
SELECT * FROM users WHERE onboarding_completed = true;
```

### Find Users Who Completed Profile

```sql
SELECT * FROM users WHERE profile_completed = true;
```

### Conversion Funnel Analysis

```sql
SELECT 
  COUNT(*) FILTER (WHERE password_created_at IS NOT NULL) as created_password,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed_onboarding,
  COUNT(*) FILTER (WHERE profile_completed = true) as completed_profile
FROM users;
```

## Integration with Other Tables

The `users` table connects to:
- **`auth.users`**: Via `user_id` (one-to-one)
- **`contacts`**: Via `user_id` (one-to-one)
- **`business_profiles`**: Via `user_id` (one-to-one)

## Future Enhancements

You can extend this table for:
- Subscription management (Stripe integration)
- Usage tracking (document generations, scans)
- Feature flags (premium features)
- Analytics (user behavior tracking)

## Notes

- The table uses `upsert` with `onConflict: 'user_id'` to prevent duplicates
- RLS policies ensure users can only see/update their own record
- Service role can read/update all records (for admin operations)
- Email is synced from `auth.users` but can be manually updated

